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

// Middleware za verifikaciju JWT tokena (opciono ili sa fallback-om)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Autorizacija je obavezna' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Nevažeći ili istekao token' });
    req.user = user;
    next();
  });
}

// Opcioni auth middleware (ako nema tokena, koristi podrazumevanog halil_official)
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
    });
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

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ name: 'Selamy Express PostgreSQL API', status: 'ok', version: '3.0' });
});

// -------------------------------------------------------------
// 1. AUTH RUTI
// -------------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, nickname, email, phone, password } = req.body;

    if (!full_name || !nickname || !email || !password) {
      return res.status(400).json({ error: 'Molimo popunite sva obavezna polja.' });
    }

    const cleanNick = nickname.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const existing = await pool.query(
      'SELECT id FROM users WHERE nickname = $1 OR email = $2',
      [cleanNick, cleanEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Korisničko ime ili email je već zauzet.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80';

    const insertRes = await pool.query(`
      INSERT INTO users (full_name, nickname, email, phone, password_hash, avatar, bio, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, full_name, nickname, email, phone, avatar, bio, location
    `, [
      full_name,
      cleanNick,
      cleanEmail,
      phone || '',
      password_hash,
      defaultAvatar,
      'Novi član Selamy zajednice 💙',
      'Kalesija (Babajići)'
    ]);

    const newUser = insertRes.rows[0];
    const token = jwt.sign({ id: newUser.id, nickname: newUser.nickname }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, user: newUser });
  } catch (err) {
    console.error('PostgreSQL Register error:', err);
    res.status(500).json({ error: 'Greška na serveru pri registraciji.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Unesite e-mail / nadimak i lozinku.' });
    }

    const cleanLogin = login.toLowerCase().trim();
    const userRes = await pool.query(
      'SELECT * FROM users WHERE nickname = $1 OR email = $2 OR phone = $3',
      [cleanLogin, cleanLogin, login]
    );

    const user = userRes.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Neispravno korisničko ime ili lozinka.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Neispravno korisničko ime ili lozinka.' });
    }

    const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...userProfile } = user;

    res.json({ success: true, token, user: userProfile });
  } catch (err) {
    console.error('PostgreSQL Login error:', err);
    res.status(500).json({ error: 'Greška na serveru pri prijavi.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT id, full_name, nickname, email, phone, avatar, bio, location, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Greška pri učitavanju profila' });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, bio, location, avatar, email, phone } = req.body;
    await pool.query(`
      UPDATE users 
      SET full_name = COALESCE($1, full_name),
          bio = COALESCE($2, bio),
          location = COALESCE($3, location),
          avatar = COALESCE($4, avatar),
          email = COALESCE($5, email),
          phone = COALESCE($6, phone)
      WHERE id = $7
    `, [full_name, bio, location, avatar, email, phone, req.user.id]);

    const updated = await pool.query(
      'SELECT id, full_name, nickname, email, phone, avatar, bio, location FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ success: true, user: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Greška pri ažuriranju profila' });
  }
});

// -------------------------------------------------------------
// 2. POSTS RUTI
// -------------------------------------------------------------

app.get('/api/posts', async (req, res) => {
  try {
    const postsRes = await pool.query(`
      SELECT posts.id, posts.caption, posts.image_url, posts.location, posts.likes_count, posts.created_at,
             users.nickname AS author, users.full_name, users.avatar
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
    `);
    res.json({ posts: postsRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Greška pri učitavanju objava' });
  }
});

app.post('/api/posts', optionalAuth, async (req, res) => {
  try {
    const { caption, image_url, location } = req.body;
    if (!image_url) return res.status(400).json({ error: 'Slika je obavezna' });

    const userId = req.user ? req.user.id : 1;

    const insertRes = await pool.query(`
      INSERT INTO posts (user_id, caption, image_url, location)
      VALUES ($1, $2, $3, $4)
      RETURNING id, caption, image_url, location, likes_count, created_at
    `, [userId, caption || '', image_url, location || 'Kalesija (Babajići)']);

    const newPost = insertRes.rows[0];
    const userRes = await pool.query('SELECT nickname, full_name, avatar FROM users WHERE id = $1', [userId]);
    const u = userRes.rows[0] || { nickname: 'halil_official', avatar: '' };

    res.json({
      success: true,
      post: {
        ...newPost,
        author: u.nickname,
        avatar: u.avatar
      }
    });
  } catch (err) {
    console.error('Post error:', err);
    res.status(500).json({ error: 'Greška pri čuvanju objave' });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  try {
    await pool.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [req.params.id]);
    const postRes = await pool.query('SELECT likes_count FROM posts WHERE id = $1', [req.params.id]);
    res.json({ success: true, likes_count: postRes.rows[0] ? postRes.rows[0].likes_count : 0 });
  } catch (err) {
    res.status(500).json({ error: 'Greška pri lajkovanju objave' });
  }
});

// -------------------------------------------------------------
// 3. STORIES RUTI
// -------------------------------------------------------------

app.get('/api/stories', async (req, res) => {
  try {
    const storiesRes = await pool.query(`
      SELECT stories.id, stories.media_url, stories.text, stories.created_at,
             users.nickname AS username, users.full_name, users.avatar
      FROM stories
      JOIN users ON stories.user_id = users.id
      ORDER BY stories.created_at DESC
    `);
    res.json({ stories: storiesRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Greška pri učitavanju priča' });
  }
});

app.post('/api/stories', optionalAuth, async (req, res) => {
  try {
    const { media_url, text } = req.body;
    if (!media_url) return res.status(400).json({ error: 'Slika priče je obavezna' });

    const userId = req.user ? req.user.id : 1;

    const insertRes = await pool.query(`
      INSERT INTO stories (user_id, media_url, text)
      VALUES ($1, $2, $3)
      RETURNING id, media_url, text, created_at
    `, [userId, media_url, text || '']);

    const newStory = insertRes.rows[0];
    const userRes = await pool.query('SELECT nickname, avatar FROM users WHERE id = $1', [userId]);
    const u = userRes.rows[0] || { nickname: 'halil_official', avatar: '' };

    res.json({
      success: true,
      story: {
        ...newStory,
        username: u.nickname,
        avatar: u.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Greška pri kreiranju priče' });
  }
});

// -------------------------------------------------------------
// 4. REELS RUTI
// -------------------------------------------------------------

app.get('/api/reels', async (req, res) => {
  try {
    const reelsRes = await pool.query(`
      SELECT reels.id, reels.video_url, reels.caption, reels.audio_title, reels.likes_count, reels.created_at,
             users.nickname AS author, users.full_name, users.avatar
      FROM reels
      JOIN users ON reels.user_id = users.id
      ORDER BY reels.created_at DESC
    `);
    res.json({ reels: reelsRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Greška pri učitavanju reel-ova' });
  }
});

app.post('/api/reels', optionalAuth, async (req, res) => {
  try {
    const { video_url, caption, audio_title } = req.body;
    if (!video_url) return res.status(400).json({ error: 'Video zapis ili slika za reel je obavezna' });

    const userId = req.user ? req.user.id : 1;

    const insertRes = await pool.query(`
      INSERT INTO reels (user_id, video_url, caption, audio_title)
      VALUES ($1, $2, $3, $4)
      RETURNING id, video_url, caption, audio_title, likes_count, created_at
    `, [userId, video_url, caption || '', audio_title || 'Selamy Original Audio']);

    const newReel = insertRes.rows[0];
    const userRes = await pool.query('SELECT nickname, avatar FROM users WHERE id = $1', [userId]);
    const u = userRes.rows[0] || { nickname: 'halil_official', avatar: '' };

    res.json({
      success: true,
      reel: {
        id: newReel.id,
        video: newReel.video_url,
        caption: newReel.caption,
        audio: newReel.audio_title,
        likes: newReel.likes_count,
        author: u.nickname,
        avatar: u.avatar,
        comments: []
      }
    });
  } catch (err) {
    console.error('Create Reel error:', err);
    res.status(500).json({ error: 'Greška pri kreiranju reel-a' });
  }
});

app.post('/api/reels/:id/like', async (req, res) => {
  try {
    await pool.query('UPDATE reels SET likes_count = likes_count + 1 WHERE id = $1', [req.params.id]);
    const reelRes = await pool.query('SELECT likes_count FROM reels WHERE id = $1', [req.params.id]);
    res.json({ success: true, likes_count: reelRes.rows[0] ? reelRes.rows[0].likes_count : 0 });
  } catch (err) {
    res.status(500).json({ error: 'Greška pri lajkovanju reel-a' });
  }
});

// -------------------------------------------------------------
// 5. FORUM RUTI
// -------------------------------------------------------------

app.get('/api/forum', async (req, res) => {
  try {
    const forumRes = await pool.query(`
      SELECT forum_topics.*, users.nickname AS author, users.avatar AS authorAvatar
      FROM forum_topics
      JOIN users ON forum_topics.user_id = users.id
      ORDER BY forum_topics.created_at DESC
    `);
    res.json({ topics: forumRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Greška pri učitavanju foruma' });
  }
});

app.post('/api/forum/topics', optionalAuth, async (req, res) => {
  try {
    const { category, title, content } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Sva polja su obavezna' });
    }

    const userId = req.user ? req.user.id : 1;

    const insertRes = await pool.query(`
      INSERT INTO forum_topics (user_id, category, title, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, category, title, content, likes_count, replies_count, created_at
    `, [userId, category, title, content]);

    const newTopic = insertRes.rows[0];
    const userRes = await pool.query('SELECT nickname, avatar FROM users WHERE id = $1', [userId]);
    const u = userRes.rows[0] || { nickname: 'halil_official', avatar: '' };

    res.json({
      success: true,
      topic: {
        ...newTopic,
        author: u.nickname,
        authorAvatar: u.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Greška pri otvaranju teme' });
  }
});

// Serving Statik Frontend iz 'dist' foldera (ako postoji build)
const distPath = path.resolve('dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ name: 'Selamy Express PostgreSQL Server', status: 'ok', docs: '/api/health' });
  });
}

// Server pokretanje
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Selamy Express PostgreSQL Server pokrenut na portu ${PORT}`);
});
