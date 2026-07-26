// SELAMY EXPRESS API SERVER SA POSTGRESQL BAZOM
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import pool, { initDB } from './src/db/index.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'selamy_jwt_secret_key_2025';

app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// Inicijalizacija PostgreSQL Baze
initDB();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Autorizacija je obavezna za ovu akciju' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Nevažeći ili istekao token' });
    req.user = user;
    next();
  });
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {}
  }
  if (!req.user) {
    try {
      const userRes = await pool.query('SELECT id, nickname FROM users WHERE nickname = $1', ['halil_official']);
      if (userRes.rows.length > 0) {
        req.user = { id: userRes.rows[0].id, nickname: userRes.rows[0].nickname };
      }
    } catch (e) {}
  }
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ name: 'Selamy PostgreSQL API', status: 'ok', version: '3.1' });
});

// ========= AUTH =========
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, nickname, email, phone, password } = req.body;
    if (!full_name || !nickname || !email || !password) return res.status(400).json({ error: 'Molimo popunite sva obavezna polja.' });
    const cleanNick = nickname.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();
    const existing = await pool.query('SELECT id FROM users WHERE nickname = $1 OR email = $2', [cleanNick, cleanEmail]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Korisničko ime ili email je već zauzet.' });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const insertRes = await pool.query(`
      INSERT INTO users (full_name, nickname, email, phone, password_hash, avatar, bio, location)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id, full_name, nickname, email, phone, avatar, bio, location
    `, [full_name, cleanNick, cleanEmail, phone||'', hash, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', 'Novi član Selamy zajednice 💙', 'Kalesija (Babajići)']);

    const newUser = insertRes.rows[0];
    const token = jwt.sign({ id: newUser.id, nickname: newUser.nickname }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: newUser });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Greška na serveru pri registraciji.' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'Unesite korisničko ime i lozinku.' });
    const q = login.toLowerCase().trim();
    const userRes = await pool.query('SELECT * FROM users WHERE nickname = $1 OR email = $2 OR phone = $3', [q, q, login]);
    const user = userRes.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Neispravno korisničko ime ili lozinka.' });
    const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...u } = user;
    res.json({ success: true, token, user: u });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Greška na serveru pri prijavi.' }); }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT id, full_name, nickname, email, phone, avatar, bio, location, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Korisnik nije pronađen' });
    res.json({ user: r.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Greška pri učitavanju profila' }); }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, bio, location, avatar, email, phone } = req.body;
    await pool.query(`UPDATE users SET full_name=COALESCE($1,full_name), bio=COALESCE($2,bio), location=COALESCE($3,location), avatar=COALESCE($4,avatar), email=COALESCE($5,email), phone=COALESCE($6,phone) WHERE id=$7`, [full_name, bio, location, avatar, email, phone, req.user.id]);
    const r = await pool.query('SELECT id, full_name, nickname, email, phone, avatar, bio, location FROM users WHERE id=$1', [req.user.id]);
    res.json({ success: true, user: r.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Greška pri ažuriranju profila' }); }
});

// ========= POSTS + COMMENTS + LIKES =========
app.get('/api/posts', optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;

    const postsRes = await pool.query(`
      SELECT p.id, p.caption, p.image_url, p.location, p.comments_count, p.created_at,
             u.nickname AS author, u.full_name, u.avatar,
             (SELECT COUNT(*)::int FROM likes WHERE post_id = p.id) AS likes_count,
             CASE WHEN $1::int IS NOT NULL THEN EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1::int) ELSE false END AS liked_by_me
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `, [currentUserId]);

    const posts = [];
    for (const p of postsRes.rows) {
      const commentsRes = await pool.query(`SELECT c.id, c.text, c.created_at, u.nickname AS user FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = $1 ORDER BY c.created_at ASC`, [p.id]);
      posts.push({ ...p, comments: commentsRes.rows });
    }
    res.json({ posts });
  } catch (err) { console.error('GET /api/posts error:', err); res.status(500).json({ error: 'Greška pri učitavanju objava' }); }
});

app.post('/api/posts', optionalAuth, async (req, res) => {
  try {
    const { caption, image_url, location } = req.body;
    if (!image_url) return res.status(400).json({ error: 'Slika je obavezna' });
    const userId = req.user ? req.user.id : 1;
    const insertRes = await pool.query(`INSERT INTO posts (user_id, caption, image_url, location) VALUES ($1,$2,$3,$4) RETURNING id, caption, image_url, location, likes_count, comments_count, created_at`, [userId, caption||'', image_url, location||'Kalesija (Babajići)']);
    const newPost = insertRes.rows[0];
    const u = (await pool.query('SELECT nickname, full_name, avatar FROM users WHERE id=$1', [userId])).rows[0] || { nickname: 'halil_official', avatar: '' };
    res.json({ success: true, post: { ...newPost, likes_count: 0, liked_by_me: false, author: u.nickname, avatar: u.avatar, comments: [] } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Greška pri čuvanju objave' }); }
});

app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(postId)) return res.status(400).json({ error: 'Nevažeći ID objave' });

    // Check if post exists
    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) return res.status(404).json({ error: 'Objava nije pronađena' });

    // Check if like exists
    const existing = await pool.query('SELECT id FROM likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    let liked = false;

    if (existing.rows.length > 0) {
      // Unlike
      await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      liked = false;
    } else {
      // Like
      await pool.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING', [postId, userId]);
      liked = true;
    }

    // Get exact count from likes table
    const countRes = await pool.query('SELECT COUNT(*)::int AS count FROM likes WHERE post_id = $1', [postId]);
    const likes_count = countRes.rows[0]?.count || 0;

    // Update posts cache column
    await pool.query('UPDATE posts SET likes_count = $1 WHERE id = $2', [likes_count, postId]);

    res.json({ success: true, liked, likes_count });
  } catch (err) {
    console.error('Like toggle error:', err);
    res.status(500).json({ error: 'Greška pri obradi lajka' });
  }
});

app.post('/api/posts/:id/comment', optionalAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Tekst komentara je obavezan' });
    const userId = req.user ? req.user.id : 1;
    const insertRes = await pool.query(`INSERT INTO comments (user_id, post_id, text) VALUES ($1,$2,$3) RETURNING id, text, created_at`, [userId, req.params.id, text]);
    await pool.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1', [req.params.id]);
    const u = (await pool.query('SELECT nickname FROM users WHERE id=$1', [userId])).rows[0] || { nickname: 'halil_official' };
    res.json({ success: true, comment: { ...insertRes.rows[0], user: u.nickname } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Greška pri čuvanju komentara' }); }
});

// ========= STORIES =========
app.get('/api/stories', async (req, res) => {
  try {
    const r = await pool.query(`SELECT s.id, s.media_url, s.text, s.created_at, u.nickname AS username, u.full_name, u.avatar FROM stories s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC`);
    res.json({ stories: r.rows });
  } catch (err) { res.status(500).json({ error: 'Greška pri učitavanju priča' }); }
});

app.post('/api/stories', optionalAuth, async (req, res) => {
  try {
    const { media_url, text } = req.body;
    if (!media_url) return res.status(400).json({ error: 'Slika priče je obavezna' });
    const userId = req.user ? req.user.id : 1;
    const insertRes = await pool.query(`INSERT INTO stories (user_id, media_url, text) VALUES ($1,$2,$3) RETURNING id, media_url, text, created_at`, [userId, media_url, text||'']);
    const u = (await pool.query('SELECT nickname, avatar FROM users WHERE id=$1', [userId])).rows[0] || { nickname: 'halil_official', avatar: '' };
    res.json({ success: true, story: { ...insertRes.rows[0], username: u.nickname, avatar: u.avatar } });
  } catch (err) { res.status(500).json({ error: 'Greška pri kreiranju priče' }); }
});

// ========= REELS =========
app.get('/api/reels', async (req, res) => {
  try {
    const r = await pool.query(`SELECT r.id, r.video_url, r.caption, r.audio_title, r.likes_count, r.comments_count, r.created_at, u.nickname AS author, u.full_name, u.avatar FROM reels r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC`);
    res.json({ reels: r.rows });
  } catch (err) { res.status(500).json({ error: 'Greška pri učitavanju reel-ova' }); }
});

app.post('/api/reels', optionalAuth, async (req, res) => {
  try {
    const { video_url, caption, audio_title } = req.body;
    if (!video_url) return res.status(400).json({ error: 'Video je obavezan' });
    const userId = req.user ? req.user.id : 1;
    const insertRes = await pool.query(`INSERT INTO reels (user_id, video_url, caption, audio_title) VALUES ($1,$2,$3,$4) RETURNING id, video_url, caption, audio_title, likes_count, comments_count, created_at`, [userId, video_url, caption||'', audio_title||'Selamy Original Audio']);
    const u = (await pool.query('SELECT nickname, avatar FROM users WHERE id=$1', [userId])).rows[0] || { nickname: 'halil_official', avatar: '' };
    res.json({ success: true, reel: { id: insertRes.rows[0].id, video: insertRes.rows[0].video_url, caption: insertRes.rows[0].caption, audio: insertRes.rows[0].audio_title, likes: insertRes.rows[0].likes_count, author: u.nickname, avatar: u.avatar, comments: [] } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Greška pri kreiranju reel-a' }); }
});

app.post('/api/reels/:id/like', async (req, res) => {
  try {
    await pool.query('UPDATE reels SET likes_count = likes_count + 1 WHERE id = $1', [req.params.id]);
    const r = await pool.query('SELECT likes_count FROM reels WHERE id = $1', [req.params.id]);
    res.json({ success: true, likes_count: r.rows[0]?.likes_count || 0 });
  } catch (err) { res.status(500).json({ error: 'Greška pri lajkovanju' }); }
});

app.post('/api/reels/:id/comment', optionalAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Tekst komentara je obavezan' });
    const userId = req.user ? req.user.id : 1;
    const insertRes = await pool.query(`INSERT INTO reel_comments (user_id, reel_id, text) VALUES ($1,$2,$3) RETURNING id, text, created_at`, [userId, req.params.id, text]);
    await pool.query('UPDATE reels SET comments_count = comments_count + 1 WHERE id = $1', [req.params.id]);
    const u = (await pool.query('SELECT nickname FROM users WHERE id=$1', [userId])).rows[0] || { nickname: 'halil_official' };
    res.json({ success: true, comment: { ...insertRes.rows[0], user: u.nickname } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Greška pri čuvanju komentara' }); }
});

app.get('/api/reels/:id/comments', async (req, res) => {
  try {
    const r = await pool.query(`SELECT rc.id, rc.text, rc.created_at, u.nickname AS user FROM reel_comments rc JOIN users u ON rc.user_id = u.id WHERE rc.reel_id = $1 ORDER BY rc.created_at ASC`, [req.params.id]);
    res.json({ comments: r.rows });
  } catch (err) { res.status(500).json({ error: 'Greška pri učitavanju komentara' }); }
});

// ========= STORIES =========
app.post('/api/stories/:id/comment', optionalAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Tekst odgovora je obavezan' });
    const userId = req.user ? req.user.id : 1;
    await pool.query(`INSERT INTO story_comments (user_id, story_id, text) VALUES ($1,$2,$3)`, [userId, req.params.id, text]);
    const u = (await pool.query('SELECT nickname FROM users WHERE id=$1', [userId])).rows[0] || { nickname: 'halil_official' };
    res.json({ success: true, message: 'Odgovor na priču poslan!' });
  } catch (err) { res.status(500).json({ error: 'Greška pri slanju odgovora' }); }
});

// ========= FORUM =========
app.get('/api/forum', async (req, res) => {
  try {
    const r = await pool.query(`SELECT ft.*, u.nickname AS author, u.avatar AS authorAvatar FROM forum_topics ft JOIN users u ON ft.user_id = u.id ORDER BY ft.created_at DESC`);
    res.json({ topics: r.rows });
  } catch (err) { res.status(500).json({ error: 'Greška pri učitavanju foruma' }); }
});

app.post('/api/forum/topics', optionalAuth, async (req, res) => {
  try {
    const { category, title, content } = req.body;
    if (!title || !content || !category) return res.status(400).json({ error: 'Sva polja su obavezna' });
    const userId = req.user ? req.user.id : 1;
    const insertRes = await pool.query(`INSERT INTO forum_topics (user_id, category, title, content) VALUES ($1,$2,$3,$4) RETURNING id, category, title, content, likes_count, replies_count, created_at`, [userId, category, title, content]);
    const u = (await pool.query('SELECT nickname, avatar FROM users WHERE id=$1', [userId])).rows[0] || { nickname: 'halil_official', avatar: '' };
    res.json({ success: true, topic: { ...insertRes.rows[0], author: u.nickname, authorAvatar: u.avatar } });
  } catch (err) { res.status(500).json({ error: 'Greška pri otvaranju teme' }); }
});

// Serving Static Frontend
const distPath = path.resolve('dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => { res.sendFile(path.resolve(distPath, 'index.html')); });
} else {
  app.get('/', (req, res) => { res.json({ name: 'Selamy Express PostgreSQL Server', status: 'ok', docs: '/api/health' }); });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Selamy Express PostgreSQL Server pokrenut na portu ${PORT}`);
});
