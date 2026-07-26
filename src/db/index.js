// SELAMY POSTGRESQL DATABASE MANAGER
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/selamy';

// Proveri da li DATABASE_URL ili okruženje traži SSL
const useSSL = process.env.PGSSLMODE === 'require' || connectionString.includes('sslmode=require');

let activePool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false
});

// Proxy objekat za query pozive kako bi re-inicijalizacija pool-a bez SSL-a radila providno
export const pool = {
  query: (...args) => activePool.query(...args),
  end: () => activePool.end()
};

export async function initDB() {
  try {
    // Provera konekcije i eventualni fallback sa SSL na non-SSL
    try {
      await activePool.query('SELECT 1');
    } catch (connErr) {
      if (connErr.message && connErr.message.includes('does not support SSL')) {
        console.log('⚠️ PostgreSQL server ne zahteva SSL, prebacujem konekciju na non-SSL...');
        await activePool.end();
        activePool = new Pool({
          connectionString,
          ssl: false
        });
        await activePool.query('SELECT 1');
      } else {
        throw connErr;
      }
    }

    // Kreiranje SQL tabela (Migracije)
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        nickname VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(100),
        password_hash TEXT NOT NULL,
        avatar TEXT,
        bio TEXT,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        caption TEXT,
        image_url TEXT NOT NULL,
        location TEXT,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        media_url TEXT NOT NULL,
        text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        video_url TEXT NOT NULL,
        caption TEXT,
        audio_title TEXT,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS forum_topics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        likes_count INTEGER DEFAULT 0,
        replies_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ PostgreSQL migracije uspešno izvršene (Sve tabele su spremne)');

    // Provera i kreiranje podrazumevanog naloga halil_official
    const userRes = await activePool.query('SELECT * FROM users WHERE nickname = $1', ['halil_official']);
    if (userRes.rows.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('selamy123', salt);

      await activePool.query(`
        INSERT INTO users (full_name, nickname, email, phone, password_hash, avatar, bio, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        'Halil Hodžić',
        'halil_official',
        'halil@selamy.ba',
        '+38761123456',
        hash,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        'Digitalni kreator & ljubitelj fotografije 📷 | Kalesija, BiH 🇧🇦 | Život u plavim tonovima 💙',
        'Kalesija (Babajići)'
      ]);
      console.log('✅ Defaultni nalog halil_official uspešno kreiran u PostgreSQL bazi');
    }
  } catch (err) {
    console.error('⚠️ PostgreSQL inicijalizacija DB-a greška:', err.message);
  }
}

export default pool;
