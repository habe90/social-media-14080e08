// SELAMY - CENTRAL STATE STORE (DYNAMICAL DATABASE SYNC)

export const state = {
  activeTab: 'home',

  // Vlasnik profila (Halil Hodžić)
  currentUser: {
    username: 'halil_official',
    fullname: 'Halil Hodžić',
    email: 'halil.hodzic@selamy.ba',
    phone: '+387 61 123 456',
    smsVerified: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Digitalni kreator i ljubitelj fotografije 📷\nKalesija, BiH 🇧🇦 | Život u plavim tonovima 💙',
    location: null,
    followers: 1,
    following: 1,
    postsCount: 0
  },

  // Vaktija i namaska vremena
  prayerTimes: {
    fajr: '04:30',
    dhuhr: '12:05',
    asr: '15:30',
    maghrib: '18:00',
    isha: '19:30',
    locationName: 'Sarajevo, BiH',
    activePrayerName: 'Jacija',
    nextPrayerName: 'Sabah (sutra)',
    timeLeft: '9h 15m'
  },

  // Inspiracija dana (ajet / hadis / citat)
  dailyInspiration: {
    id: 'insp-1',
    type: 'Ajet dana',
    source: 'Sura Al-Baqarah, 153',
    text: '„O vjernici, tražite sebi pomoći u strpljivosti i obavljanju molitve! Allah je doista na strani strpljivih.”',
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ'
  },

  // Dnevni izazov dobrih djela
  dailyChallenges: [
    { id: 'ch-1', title: 'Udijeli osmijeh i lijepu riječ nekome danas', category: 'Nasihat', completed: true },
    { id: 'ch-2', title: 'Prouči suru Al-Mulk pred spavanje', category: 'Znanje', completed: true },
    { id: 'ch-3', title: 'Nazovi nekog od rodbine ili prijatelja', category: 'Zajednica', completed: false },
    { id: 'ch-4', title: 'Udijeli malu sadaku u sklopu humanitarne akcije', category: 'Humanitarno', completed: false }
  ],

  // Sažeti medijski sadržaj za upload
  uploadedMedia: {
    post: null,
    story: null,
    reel: null
  },

  // Čisti dinamički nizovi iz baze (BEZ MOCK PODATAKA)
  forumTopics: [],
  stories: [],
  posts: [],
  reels: [],

  // Poruke (Chat)
  chats: [],

  // Prijedlozi za praćenje
  suggestions: [],

  likedPosts: new Set(),
  likedReels: new Set(),
  activeChatId: null,
  activeReelCommentId: null,

  // Stanje pregledača priča
  storyState: {
    active: false,
    storyIndex: 0,
    slideIndex: 0,
    timer: null,
    progress: 0,
    isPaused: false
  }
};
