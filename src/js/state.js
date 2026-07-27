// SELAMY - CENTRAL STATE STORE (DATABASE SYNC)

export const state = {
  activeTab: 'home',

  currentUser: {
    loggedIn: false,
    id: null,
    username: '',
    fullname: '',
    email: '',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: '',
    location: null,
    followers: 0,
    following: 0,
    postsCount: 0
  },

  prayerTimes: { fajr: '04:30', dhuhr: '12:05', asr: '15:30', maghrib: '18:00', isha: '19:30', locationName: 'Sarajevo, BiH', activePrayerName: 'Jacija', nextPrayerName: 'Sabah (sutra)', timeLeft: '9h 15m' },

  dailyInspiration: { id: 'insp-1', type: 'Ajet dana', source: 'Sura El-Bekare, 153', text: '„O vjernici, tražite sebi pomoći u strpljivosti i obavljanju molitve! Allah je doista na strani strpljivih.”', arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ' },

  dailyChallenges: [],
  challengeStats: { totalCompletedAllTime: 0, streakDays: 0 },

  uploadedMedia: { post: null, story: null, reel: null },
  forumTopics: [], stories: [], posts: [], reels: [], chats: [], suggestions: [],

  likedPosts: new Set(),
  likedReels: new Set(),

  activeChatId: null, activeReelCommentId: null,

  storyState: { active: false, storyIndex: 0, slideIndex: 0, timer: null, progress: 0, isPaused: false }
};
