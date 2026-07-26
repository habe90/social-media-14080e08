import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

const AVATAR_COLORS = [
  'linear-gradient(135deg, #1e90ff, #0066cc)',
  'linear-gradient(135deg, #ff6b6b, #cc0000)',
  'linear-gradient(135deg, #51cf66, #2b8a3e)',
  'linear-gradient(135deg, #ff922b, #e67700)',
  'linear-gradient(135deg, #845ef7, #5c3ac5)',
  'linear-gradient(135deg, #f06595, #c92a5a)',
  'linear-gradient(135deg, #20c997, #0ca678)',
  'linear-gradient(135deg, #ffd43b, #e6b800)',
];

export const DEMO_USERS = [
  { id: 1, username: 'luka_markovic', name: 'Luka Marković', avatar: AVATAR_COLORS[0], initial: 'L' },
  { id: 2, username: 'ana_petrovic', name: 'Ana Petrović', avatar: AVATAR_COLORS[1], initial: 'A' },
  { id: 3, username: 'nikola_jovan', name: 'Nikola Jovanović', avatar: AVATAR_COLORS[2], initial: 'N' },
  { id: 4, username: 'mila_design', name: 'Mila Dizajn', avatar: AVATAR_COLORS[3], initial: 'M' },
  { id: 5, username: 'stefan_photography', name: 'Stefan Fotograf', avatar: AVATAR_COLORS[4], initial: 'S' },
  { id: 6, username: 'jovana_art', name: 'Jovana Umetnost', avatar: AVATAR_COLORS[5], initial: 'J' },
  { id: 7, username: 'marko_travel', name: 'Marko Putnik', avatar: AVATAR_COLORS[6], initial: 'M' },
  { id: 8, username: 'petra_fitness', name: 'Petra Fit', avatar: AVATAR_COLORS[7], initial: 'P' },
];

const POST_EMOJIS = ['🌅', '🏙️', '🎨', '📸', '🌊', '🏔️', '🌸', '🎭', '✨', '🍕', '🐶', '🎸', '🚀', '☕', '🏡', '🌈'];

function randomEmoji() {
  return POST_EMOJIS[Math.floor(Math.random() * POST_EMOJIS.length)];
}

function timeAgo(hours) {
  if (hours < 1) return `${Math.floor(hours * 60)} min`;
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

const INITIAL_POSTS = [
  {
    id: 1,
    userId: 1,
    emoji: '🌅',
    caption: 'Savršeno jutro uz kafu na terasi ☕✨',
    location: 'Beograd, Srbija',
    likes: [2, 3, 4, 5],
    saved: false,
    comments: [
      { id: 1, userId: 2, text: 'Predivno! 🌞' },
      { id: 2, userId: 3, text: 'Gde je ovo tačno?' },
    ],
    timeAgo: '2h',
  },
  {
    id: 2,
    userId: 2,
    emoji: '🎨',
    caption: 'Novi dizajn enterijera koji sam završila juče. Šta mislite? 🏠💙',
    location: 'Novi Sad, Srbija',
    likes: [1, 3, 4, 5, 6, 7],
    saved: false,
    comments: [
      { id: 3, userId: 1, text: 'Fenomenalno izgleda!' },
      { id: 4, userId: 4, text: 'Inspiracija 🔥' },
      { id: 5, userId: 5, text: 'Koje boje si koristila?' },
    ],
    timeAgo: '5h',
  },
  {
    id: 3,
    userId: 5,
    emoji: '🏔️',
    caption: 'Tara danas... Priroda je neprevaziđena 🌲🏞️',
    location: 'Nacionalni park Tara',
    likes: [1, 2, 3, 4, 6, 7, 8],
    saved: false,
    comments: [
      { id: 6, userId: 7, text: 'Prelepo mesto!' },
    ],
    timeAgo: '8h',
  },
  {
    id: 4,
    userId: 4,
    emoji: '✨',
    caption: 'Novi brend identitet za Selamy — moderna društvena mreža ✨💙🖤',
    location: 'Studio Mila',
    likes: [1, 2, 3, 5, 6],
    saved: false,
    comments: [
      { id: 7, userId: 6, text: 'Obožavam ovaj dizajn!' },
      { id: 8, userId: 1, text: 'Svaka čast 👏' },
    ],
    timeAgo: '12h',
  },
  {
    id: 5,
    userId: 7,
    emoji: '🌊',
    caption: 'Zalazak sunca na Jadranu 🌅💙 More, mir i dobra knjiga.',
    location: 'Budva, Crna Gora',
    likes: [1, 2, 4, 5, 6, 7, 8],
    saved: false,
    comments: [
      { id: 9, userId: 8, text: 'Fali mi more 🥺' },
    ],
    timeAgo: '1d',
  },
];

const INITIAL_STORIES = [
  { id: 1, userId: 1, seen: true },
  { id: 2, userId: 2, seen: false },
  { id: 3, userId: 3, seen: false },
  { id: 4, userId: 4, seen: false },
  { id: 5, userId: 5, seen: true },
  { id: 6, userId: 6, seen: false },
  { id: 7, userId: 7, seen: false },
  { id: 8, userId: 8, seen: false },
];

export function AppProvider({ children }) {
  const currentUser = DEMO_USERS[0];
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [stories, setStories] = useState(INITIAL_STORIES);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleLike = (postId) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const liked = p.likes.includes(currentUser.id);
        return {
          ...p,
          likes: liked
            ? p.likes.filter(id => id !== currentUser.id)
            : [...p.likes, currentUser.id],
        };
      })
    );
  };

  const toggleSave = (postId) => {
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, saved: !p.saved } : p))
    );
  };

  const addComment = (postId, text) => {
    if (!text.trim()) return;
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [
            ...p.comments,
            { id: Date.now(), userId: currentUser.id, text: text.trim() },
          ],
        };
      })
    );
  };

  const createPost = ({ caption, location }) => {
    const newPost = {
      id: Date.now(),
      userId: currentUser.id,
      emoji: randomEmoji(),
      caption,
      location: location || 'Nepoznata lokacija',
      likes: [],
      saved: false,
      comments: [],
      timeAgo: 'upravo',
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const getUserById = (id) => DEMO_USERS.find(u => u.id === id) || currentUser;

  const value = {
    currentUser,
    posts,
    stories,
    showCreateModal,
    setShowCreateModal,
    toggleLike,
    toggleSave,
    addComment,
    createPost,
    getUserById,
    users: DEMO_USERS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
