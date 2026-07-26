// SELAMY - CENTRAL STATE STORE

export const state = {
  activeTab: 'home',

  // Vlasnik profila (Halil Hodžić)
  currentUser: {
    username: 'halil_official',
    fullname: 'Halil Hodžić',
    email: 'halil.hodzic@selamy.ba',
    phone: '+387 61 123 456',
    smsVerified: true,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    bio: 'Digitalni kreator i ljubitelj fotografije 📷\nSarajevo, BiH 🇧🇦 | Život u plavim tonovima 💙',
    location: null,
    followers: 1420,
    following: 380,
    postsCount: 14
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

  // Sažeti medijski sadržaj
  uploadedMedia: {
    post: null,
    story: null,
    reel: null
  },

  // Forum teme i diskusije
  forumTopics: [
    {
      id: 'ft-1',
      title: 'Savjeti za usklađivanje poslovnih obaveza i namaskih vremena',
      author: 'halil_official',
      authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80',
      category: 'nasihat',
      categoryLabel: '💡 Savjeti i nasihat',
      timeAgo: 'prije 2 sata',
      upvotes: 28,
      upvoted: true,
      repliesCount: 7,
      content: 'Esselamu alejkum svima! Želio sam pokrenuti diskusiju o tome koje rutine ili aplikacije koristite za organizaciju radnog dana tokom namaskih vremena kada radite u kancelariji ili na terenu?',
      replies: [
        { id: 'fr-1', user: 'tarik_fit', text: 'Ja obavezno koristim podsjetnik i na pauzi obavim namaz na vrijeme.', time: 'prije 1 sat' },
        { id: 'fr-2', user: 'emina_k', text: 'Odlična tema! Meni pomaže i blokiranje kalendara na poslu za vrijeme pauze.', time: 'prije 30m' }
      ]
    },
    {
      id: 'ft-2',
      title: 'Humanitarna akcija: Prikupljanje pomoći za obroke u narodnoj kuhinji',
      author: 'sarajevo_travel',
      authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&q=80',
      category: 'humanitarno',
      categoryLabel: '🤝 Humanitarno',
      timeAgo: 'prije 5 sati',
      upvotes: 45,
      upvoted: false,
      repliesCount: 12,
      content: 'Organizujemo akciju prikupljanja namirnica za ugrožene porodice tokom ove sedmice. Svi koji žele učestvovati mogu se javiti u poruke ili ostaviti komentar ispod.',
      replies: [
        { id: 'fr-3', user: 'halil_official', text: 'Podržavam! Podijelićemo ovu akciju i u pričama na mreži Selamy.', time: 'prije 4 sata' }
      ]
    },
    {
      id: 'ft-3',
      title: 'Preporuke korisnih knjiga za lični i duhovni razvoj',
      author: 'amina_style',
      authorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&q=80',
      category: 'znanje',
      categoryLabel: '📚 Znanje i edukacija',
      timeAgo: 'prije 1 dan',
      upvotes: 34,
      upvoted: false,
      repliesCount: 9,
      content: 'Koje su vaše omiljene knjige koje su vam pomogle u izgradnji boljeg karaktera i poboljšanju organizacije vremena?',
      replies: []
    }
  ],

  // Priče
  stories: [
    {
      id: 'my-story',
      isMe: true,
      username: 'Vaša priča',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      hasUnseen: true,
      slides: [
        {
          id: 'my-1',
          media: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
          time: 'prije 15m',
          text: 'Novi projekat u pripremi! 💙✨ #Selamy'
        }
      ]
    },
    {
      id: 's1',
      username: 'emina_k',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      hasUnseen: true,
      slides: [
        {
          id: 's1-1',
          media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
          time: 'prije 2h',
          text: 'Zalasci sunca na obali 🌊✨'
        }
      ]
    },
    {
      id: 's2',
      username: 'tarik_fit',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      hasUnseen: true,
      slides: [
        {
          id: 's2-1',
          media: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
          time: 'prije 4h',
          text: 'Jutarnji trening i zdrav doručak! 💪🔥'
        }
      ]
    },
    {
      id: 's3',
      username: 'sarajevo_travel',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      hasUnseen: true,
      slides: [
        {
          id: 's3-1',
          media: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
          time: 'prije 5h',
          text: 'Uživamo u jesenskim bojama grada 🍂🏰'
        }
      ]
    }
  ],

  // Objave
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
      isFollowing: true,
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
      isFollowing: false,
      timeAgo: 'prije 5 sati',
      comments: [
        { id: 'c3', user: 'amina_style', text: 'Savršene boje, Halile! ✨' }
      ]
    },
    {
      id: 'p3',
      author: 'tarik_fit',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      verified: false,
      location: 'Olimpijska planina Bjelašnica',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
      caption: 'Planinarenje do samog vrha! Svjež zrak i nevjerovatan pogled 🏔️ Odmor za dušu i tijelo!',
      likes: 215,
      liked: false,
      saved: false,
      isFollowing: false,
      timeAgo: 'prije 1 dan',
      comments: []
    }
  ],

  // Reels (kratki video zapisi)
  reels: [
    {
      id: 'reel-1',
      author: 'denis_photog',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
      caption: 'Kratki vodič za noćnu fotografiju u gradu 🌙📸 Svjetla i sjene!',
      video: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
      audio: 'Originalni zvuk - denis_photog',
      likes: 1240,
      liked: false,
      comments: [
        { user: 'halil_official', text: 'Odlične postavke kamere! ✨' },
        { user: 'emina_k', text: 'Neonska svjetla su premoćna 🔥' }
      ]
    },
    {
      id: 'reel-2',
      author: 'sarajevo_travel',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&q=80',
      caption: 'Šetnja uz obalu u zalazak sunca 🌊 Spektakl prirode u plavim tonovima!',
      video: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
      audio: 'Zalazak sunca u Neumu 🎷',
      likes: 3410,
      liked: true,
      comments: [
        { user: 'tarik_fit', text: 'Kakav mir i tišina! 🙌' }
      ]
    }
  ],

  // Poruke (Chat)
  chats: [
    {
      id: 'chat-1',
      username: 'emina_k',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      unread: 2,
      messages: [
        { text: 'Esselamu alejkum Halile! Jesi li vidio novu akciju na forumu?', time: '14:20', isMine: false },
        { text: 'Alejkumu sselam Emina! Jesam, podijelićemo je na našoj mreži odmah 😊', time: '14:22', isMine: true },
        { text: 'Odlično, hvala ti puno! Sviđa mi se novi izgled profila! 💙', time: '14:25', isMine: false }
      ]
    },
    {
      id: 'chat-2',
      username: 'tarik_fit',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      unread: 0,
      messages: [
        { text: 'Pozdrav, jesi li vidio nove teme na Forumu zajednice?', time: 'juče', isMine: false }
      ]
    }
  ],

  // Prijedlozi
  suggestions: [
    { username: 'denis_photog', name: 'Denis Kazić', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80' },
    { username: 'leyla_design', name: 'Leyla Nur', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80' },
    { username: 'bih_nature', name: 'Priroda BiH', avatar: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=150&q=80' }
  ],

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
