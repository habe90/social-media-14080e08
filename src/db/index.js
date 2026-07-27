// SELAMY POSTGRESQL DATABASE MANAGER
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/selamy';
const useSSL = process.env.PGSSLMODE === 'require' || connectionString.includes('sslmode=require');

let activePool = new Pool({ connectionString, ssl: useSSL ? { rejectUnauthorized: false } : false });

export const pool = {
  query: (...args) => activePool.query(...args),
  end: () => activePool.end()
};

export async function initDB() {
  try {
    try { await activePool.query('SELECT 1'); }
    catch (connErr) {
      if (connErr.message?.includes('does not support SSL')) {
        await activePool.end();
        activePool = new Pool({ connectionString, ssl: false });
        await activePool.query('SELECT 1');
      } else throw connErr;
    }

    await activePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL, nickname VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL, phone VARCHAR(100),
        password_hash TEXT NOT NULL, avatar TEXT, bio TEXT, location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        caption TEXT, image_url TEXT NOT NULL, location TEXT,
        likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT likes_post_user_unique UNIQUE (post_id, user_id)
      );
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS stories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        media_url TEXT NOT NULL, text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, expires_at TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS story_comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS reels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        video_url TEXT NOT NULL, caption TEXT, audio_title TEXT,
        likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS reel_comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reel_id INTEGER NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS forum_topics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(255) NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL,
        likes_count INTEGER DEFAULT 0, replies_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        reel_id INTEGER REFERENCES reels(id) ON DELETE CASCADE,
        text TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Dopunske migracije za kolone dodane nakon prvobitnog CREATE TABLE
    // (CREATE TABLE IF NOT EXISTS se ne pokreće ponovo na već postojećim tabelama)
    await activePool.query(`
      ALTER TABLE reels ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
      ALTER TABLE reels ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
    `);

    console.log('✅ PostgreSQL migracije uspešno izvršene');

    // Clean up invalid blob: URLs
    await activePool.query(`DELETE FROM reels WHERE video_url LIKE 'blob:%'`);
    await activePool.query(`DELETE FROM posts WHERE image_url LIKE 'blob:%'`);

    let userId;
    const userRes = await activePool.query('SELECT id FROM users WHERE nickname = $1', ['halil_official']);
    if (userRes.rows.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('selamy123', salt);
      const ins = await activePool.query(`INSERT INTO users (full_name, nickname, email, phone, password_hash, avatar, bio, location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [
        'Halil Hodžić', 'halil_official', 'halil@selamy.ba', '+38761123456', hash,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        'Digitalni kreator & ljubitelj fotografije 📷 | Kalesija, BiH 🇧🇦 | Život u plavim tonovima 💙', 'Kalesija (Babajići)'
      ]);
      userId = ins.rows[0].id;
      console.log('✅ Defaultni nalog halil_official kreiran');
    } else {
      userId = userRes.rows[0].id;
    }

    // Create a second test user if not exists for notifications test
    const user2Res = await activePool.query('SELECT id FROM users WHERE nickname = $1', ['emina_k']);
    let user2Id;
    if (user2Res.rows.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('selamy123', salt);
      const ins2 = await activePool.query(`INSERT INTO users (full_name, nickname, email, phone, password_hash, avatar, bio, location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [
        'Emina Kovačević', 'emina_k', 'emina@selamy.ba', '+38761222333', hash,
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        'Ljubitelj prirode i arhitekture ✨ | Sarajevo', 'Sarajevo'
      ]);
      user2Id = ins2.rows[0].id;
    } else {
      user2Id = user2Res.rows[0].id;
    }

    // Seed sample posts if posts table is empty
    const postsCountRes = await activePool.query('SELECT COUNT(*)::int AS count FROM posts');
    if (postsCountRes.rows[0].count === 0) {
      await activePool.query(`
        INSERT INTO posts (user_id, caption, image_url, location) VALUES
        ($1, 'Pogled na sunčani dan u Kalesiji 🌅 #fotografije #kalesija #priroda #selamy', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80', 'Kalesija (Babajići)'),
        ($1, 'Kafa sa pogledom na staru čaršiju u Sarajevu ☕🕌 #sarajevo #putovanja #bosna', 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80', 'Sarajevo'),
        ($2, 'Prelijep zalazak sunca na planini 🏔️✨ #putovanja #priroda #fotografije', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80', 'Planina Bjelašnica'),
        ($1, 'Edukativan dan i učenje novih vještina 📚💡 #tehnologija #znanje #nasihat', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80', 'Kalesija'),
        ($2, 'Arhitektura i plavi tonovi grada 🏙️ #moda #fotografije #sarajevo', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80', 'Sarajevo')
      `, [userId, user2Id]);
      console.log('✅ Inicijalne objave sačuvane u PostgreSQL bazi');
    }

    // Seed sample reels if reels table is empty
    const reelsRes = await activePool.query('SELECT COUNT(*)::int AS count FROM reels');
    if (reelsRes.rows[0].count === 0) {
      await activePool.query(`
        INSERT INTO reels (user_id, video_url, caption, audio_title, likes_count, comments_count) VALUES
        ($1, 'https://assets.mixkit.co/videos/preview/mixkit-nature-landscape-with-mountains-and-a-lake-41235-large.mp4', 'Lijepi prizori prirode u BiH 🌄 #priroda #selamy', 'Zvuk prirode - Halil Hodžić', 12, 3),
        ($1, 'https://assets.mixkit.co/videos/preview/mixkit-a-far-view-of-a-mosque-in-a-city-43152-large.mp4', 'Mir i tišina pred namaz 🕌✨', 'Duševni mir - Selamy Network', 24, 7)
      `, [userId]);
      console.log('✅ Inicijalni Reel video zapisi sačuvani u PostgreSQL bazi');
    }

  } catch (err) {
    console.error('⚠️ PostgreSQL greška:', err.message);
  }
}

export default pool;
