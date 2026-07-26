import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = 'selamy_secret_key_2026_safe';

// Baza podataka u memoriji (sa preddefinisanim nalozima i podacima)
const db = {
  users: [
    {
      id: 'usr-1',
      username: 'halil_official',
      fullname: 'Halil Hodžić',
      email: 'halil.hodzic@selamy.ba',
      phone: '+387 61 123 456',
      passwordHash: bcrypt.hashSync('123456', 8),
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
      bio: 'Digitalni kreator i ljubitelj fotografije 📷\nSarajevo, BiH 🇧🇦 | Život u plavim tonovima 💙',
      followersCount: 1420,
      followingCount: 380
    },
    {
      id: 'usr-2',
      username: 'emina_k',
      fullname: 'Emina Kovačević',
      email: 'emina@selamy.ba',
      phone: '+387 62 987 654',
      passwordHash: bcrypt.hashSync('123456', 8),
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      bio: 'Ljubitelj putovanja i prirode 🌸',
      followersCount: 890,
      followingCount: 210
    }
  ],
  posts: [
    {
      id: 'p1',
      author: 'sarajevo_travel',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      verified: true,
      location: 'Baščaršija, Sarajevo',
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
      caption: 'Predivno popodne na staroj Baščaršiji uz tradicionalnu bosansku kafu ☕🏰 Kakvi su vaši planovi za vikend?',
      likes: 342,
      liked: false,
      saved: false,
      timeAgo: 'prije 2 sata',
      comments: [
        { id: 'c1', user: 'emina_k', text: 'Predivna slika! 😍' },
        { id: 'c2', user: 'tarik_fit', text: 'Kafa tamo je najbolja na svijetu ☕👌' }
      ]
    },
    {
      id: 'p2',
      author: 'halil_official',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      verified: true,
      location: 'Jadransko more, Neum',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      caption: 'Miris mora i beskrajno plavetnilo. Nema ničeg opuštajućeg od zvukova talasa 🌊💙 #Selamy #PlaviMotive',
      likes: 890,
      liked: true,
      saved: true,
      timeAgo: 'prije 5 sati',
      comments: [
        { id: 'c3', user: 'amina_style', text: 'Savršene boje, Halile! ✨' }
      ]
    }
  ],
  stories: [],
  reels: [],
  forumTopics: []
};

// Middleware za verifikaciju JWT tokena
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Niste prijavljeni' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Neispravan ili istekao token' });
    req.user = user;
    next();
  });
}

// ---------------- AUTENTIFIKACIJA ----------------

// 1. REGISTRACIJA
router.post('/auth/register', (req, res) => {
  const { fullname, username, email, phone, password } = req.body;

  if (!fullname || !username || !email || !password) {
    return res.status(400).json({ error: 'Molimo popunite sva obavezna polja.' });
  }

  // Provera zauzetosti korisničkog imena ili emaila
  const existingUser = db.users.find(
    u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    return res.status(400).json({ error: 'Korisničko ime ili e-mail adresa je već u upotrebi.' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    username: username.trim(),
    fullname: fullname.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    passwordHash: bcrypt.hashSync(password, 8),
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    bio: 'Novi član mreže Selamy 💙',
    followersCount: 0,
    followingCount: 0
  };

  db.users.push(newUser);

  // Generiši token
  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, fullname: newUser.fullname, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash, ...userWithoutPassword } = newUser;

  res.status(201).json({
    message: 'Registracija uspješna!',
    token,
    user: userWithoutPassword
  });
});

// 2. PRIJAVA (LOGIN)
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Unesite korisničko ime/email i lozinku.' });
  }

  const query = username.trim().toLowerCase();
  const user = db.users.find(
    u => u.username.toLowerCase() === query || u.email.toLowerCase() === query || u.phone === query
  );

  if (!user) {
    return res.status(401).json({ error: 'Pogrešno korisničko ime, email ili lozinka.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Pogrešno korisničko ime, email ili lozinka.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, fullname: user.fullname, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash, ...userWithoutPassword } = user;

  res.json({
    message: 'Prijava uspješna!',
    token,
    user: userWithoutPassword
  });
});

// 3. TRENUTNI KORISNIK (/auth/me)
router.get('/auth/me', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' });

  const { passwordHash, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

// ---------------- OBJAVE (POSTS) ----------------
router.get('/posts', (req, res) => {
  res.json({ posts: db.posts });
});

router.post('/posts', authenticateToken, (req, res) => {
  const { image, caption, location } = req.body;

  const newPost = {
    id: `p-${Date.now()}`,
    author: req.user.username,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    verified: true,
    location: location || 'Sarajevo, BiH',
    image,
    caption: caption || '',
    likes: 0,
    liked: false,
    saved: false,
    timeAgo: 'upravo sada',
    comments: []
  };

  db.posts.unshift(newPost);
  res.status(201).json({ message: 'Objava kreirana!', post: newPost });
});

export default router;
