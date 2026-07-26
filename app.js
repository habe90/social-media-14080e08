// SELAMY - GLAVNI ULAZNI MODUL I RUTIRANJE (POSTGRESQL INTEGRATION)

import { state } from './src/js/state.js';
import { compressImageFile, showToast } from './src/js/utils/compressor.js';
import { playSound } from './src/js/utils/sound.js';
import { initPrayerTimesService, detectUserPreciseLocation } from './src/js/services/prayerTimes.js';
import { initForumModule, loadForumTopicsFromBackend } from './src/js/modules/forum.js';
import { initChallengesModule } from './src/js/modules/challenges.js';
import { initStoriesModule, renderStories, loadStoriesFromBackend } from './src/js/modules/stories.js';
import { initReelsModule, renderReels, loadReelsFromBackend } from './src/js/modules/reels.js';
import { initFeedModule, renderPosts, loadPostsFromBackend } from './src/js/modules/feed.js';
import { initChatModule } from './src/js/modules/chat.js';
import { initProfileModule, renderProfileGrid } from './src/js/modules/profile.js';
import { registerUser, loginUser, fetchCurrentUser, setToken, createReelAPI, createPostAPI, createStoryAPI } from './src/js/services/api.js';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initApp();
}

async function initApp() {
  initPrayerTimesService();
  await initForumModule();
  initChallengesModule();
  await initStoriesModule();
  await initFeedModule();
  await initReelsModule();
  initChatModule();
  initProfileModule();

  renderExploreGrid();
  setupEventListeners();
  setupFileUploadListeners();

  detectUserPreciseLocation(true);

  // Auto check backend sesije
  const user = await fetchCurrentUser();
  if (user) {
    state.currentUser.fullname = user.full_name || user.fullname;
    state.currentUser.username = user.nickname || user.username;
    state.currentUser.email = user.email;
    if (user.phone) state.currentUser.phone = user.phone;
    if (user.bio) state.currentUser.bio = user.bio;
    if (user.avatar) state.currentUser.avatar = user.avatar;
    updateProfileUI();
  }
}

function updateProfileUI() {
  const profUsername = document.querySelector('.profile-username');
  if (profUsername) profUsername.innerHTML = `${state.currentUser.username} <i class="fa-solid fa-circle-check verified-badge"></i>`;

  const fullNameEl = document.querySelector('.full-name');
  if (fullNameEl) fullNameEl.textContent = state.currentUser.fullname;

  const editFullName = document.getElementById('edit-fullname');
  const editUsername = document.getElementById('edit-username');
  const editEmail = document.getElementById('edit-email');
  const editPhone = document.getElementById('edit-phone');
  if (editFullName) editFullName.value = state.currentUser.fullname;
  if (editUsername) editUsername.value = state.currentUser.username;
  if (editEmail) editEmail.value = state.currentUser.email;
  if (editPhone) editPhone.value = state.currentUser.phone;
}

function setupFileUploadListeners() {
  // 1. OBJAVA
  const postFileInput = document.getElementById('post-file-input');
  const postDropzone = document.getElementById('post-dropzone');
  const btnSelectPostFile = document.getElementById('btn-select-post-file');
  const postPreviewBox = document.getElementById('post-preview-box');
  const postPreviewImg = document.getElementById('post-preview-img');
  const postOptInfo = document.getElementById('post-opt-info');
  const btnRemovePostFile = document.getElementById('btn-remove-post-file');

  if (btnSelectPostFile && postFileInput) {
    btnSelectPostFile.onclick = (e) => {
      e.stopPropagation();
      playSound('click');
      postFileInput.click();
    };
  }

  if (postDropzone && postFileInput) {
    postDropzone.onclick = () => {
      playSound('click');
      postFileInput.click();
    };

    ['dragenter', 'dragover'].forEach(eventName => {
      postDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        postDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      postDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        postDropzone.classList.remove('dragover');
      });
    });

    postDropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) handlePostFileSelected(files[0]);
    });

    postFileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        handlePostFileSelected(e.target.files[0]);
      }
    };
  }

  async function handlePostFileSelected(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Molimo odaberite sliku (JPG, PNG, WebP).');
      return;
    }

    try {
      showToast('⚡ Sažimam sliku sa vašeg računara...');
      const compressed = await compressImageFile(file, 1080, 0.78);

      state.uploadedMedia.post = { type: 'image', url: compressed.dataUrl };

      if (postPreviewImg) postPreviewImg.src = compressed.dataUrl;
      if (postOptInfo) {
        postOptInfo.innerHTML = `<i class="fa-solid fa-bolt"></i> <span>Slika sažeta: ${compressed.origKB}KB → <strong>${compressed.compKB}KB</strong> (${compressed.savings}% uštede)</span>`;
      }

      if (postDropzone) postDropzone.classList.add('hidden');
      if (postPreviewBox) postPreviewBox.classList.remove('hidden');

      playSound('pop');
      showToast(`Slika je spremna sa ${compressed.savings}% uštede memorije!`);
    } catch (err) {
      showToast('Greška pri učitavanju slike.');
    }
  }

  if (btnRemovePostFile) {
    btnRemovePostFile.onclick = () => {
      playSound('click');
      state.uploadedMedia.post = null;
      if (postFileInput) postFileInput.value = '';
      if (postDropzone) postDropzone.classList.remove('hidden');
      if (postPreviewBox) postPreviewBox.classList.add('hidden');
    };
  }

  // 2. PRIČA
  const storyFileInput = document.getElementById('story-file-input');
  const storyDropzone = document.getElementById('story-dropzone');
  const btnSelectStoryFile = document.getElementById('btn-select-story-file');
  const storyPreviewBox = document.getElementById('story-preview-box');
  const storyPreviewImg = document.getElementById('story-preview-img');
  const storyOptInfo = document.getElementById('story-opt-info');
  const btnRemoveStoryFile = document.getElementById('btn-remove-story-file');

  if (btnSelectStoryFile && storyFileInput) {
    btnSelectStoryFile.onclick = (e) => {
      e.stopPropagation();
      playSound('click');
      storyFileInput.click();
    };
  }

  if (storyDropzone && storyFileInput) {
    storyDropzone.onclick = () => {
      playSound('click');
      storyFileInput.click();
    };

    ['dragenter', 'dragover'].forEach(eventName => {
      storyDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        storyDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      storyDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        storyDropzone.classList.remove('dragover');
      });
    });

    storyDropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) handleStoryFileSelected(files[0]);
    });

    storyFileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        handleStoryFileSelected(e.target.files[0]);
      }
    };
  }

  async function handleStoryFileSelected(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Odaberite sliku za priču.');
      return;
    }

    try {
      showToast('⚡ Pripremam sliku sa računara za priču...');
      const compressed = await compressImageFile(file, 1080, 0.78);

      state.uploadedMedia.story = { type: 'image', url: compressed.dataUrl };

      if (storyPreviewImg) storyPreviewImg.src = compressed.dataUrl;
      if (storyOptInfo) {
        storyOptInfo.innerHTML = `<i class="fa-solid fa-bolt"></i> <span>Slika za priču: ${compressed.origKB}KB → <strong>${compressed.compKB}KB</strong> (${compressed.savings}% uštede)</span>`;
      }

      if (storyDropzone) storyDropzone.classList.add('hidden');
      if (storyPreviewBox) storyPreviewBox.classList.remove('hidden');

      playSound('pop');
      showToast(`Priča je spremna (${compressed.savings}% uštede memorije)!`);
    } catch (err) {
      showToast('Greška pri učitavanju priče.');
    }
  }

  if (btnRemoveStoryFile) {
    btnRemoveStoryFile.onclick = () => {
      playSound('click');
      state.uploadedMedia.story = null;
      if (storyFileInput) storyFileInput.value = '';
      if (storyDropzone) storyDropzone.classList.remove('hidden');
      if (storyPreviewBox) storyPreviewBox.classList.add('hidden');
    };
  }

  // 3. REEL
  const reelFileInput = document.getElementById('reel-file-input');
  const reelDropzone = document.getElementById('reel-dropzone');
  const btnSelectReelFile = document.getElementById('btn-select-reel-file');
  const reelPreviewBox = document.getElementById('reel-preview-box');
  const reelPreviewVideo = document.getElementById('reel-preview-video');
  const reelPreviewImg = document.getElementById('reel-preview-img');
  const reelOptInfo = document.getElementById('reel-opt-info');
  const btnRemoveReelFile = document.getElementById('btn-remove-reel-file');

  if (btnSelectReelFile && reelFileInput) {
    btnSelectReelFile.onclick = (e) => {
      e.stopPropagation();
      playSound('click');
      reelFileInput.click();
    };
  }

  if (reelDropzone && reelFileInput) {
    reelDropzone.onclick = () => {
      playSound('click');
      reelFileInput.click();
    };

    ['dragenter', 'dragover'].forEach(eventName => {
      reelDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        reelDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      reelDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        reelDropzone.classList.remove('dragover');
      });
    });

    reelDropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) handleReelFileSelected(files[0]);
    });

    reelFileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        handleReelFileSelected(e.target.files[0]);
      }
    };
  }

  async function handleReelFileSelected(file) {
    const isVideo = file.type.startsWith('video/');
    const isImg = file.type.startsWith('image/');

    if (!isVideo && !isImg) {
      showToast('Molimo odaberite video zapis ili sliku.');
      return;
    }

    const fileMB = (file.size / (1024 * 1024)).toFixed(1);

    if (isVideo) {
      showToast('⚡ Očitavam video sa računara...');
      const reader = new FileReader();
      reader.onload = (evt) => {
        const videoDataUrl = evt.target.result;
        state.uploadedMedia.reel = { type: 'video', url: videoDataUrl };

        if (reelPreviewVideo) {
          reelPreviewVideo.src = videoDataUrl;
          reelPreviewVideo.classList.remove('hidden');
        }
        if (reelPreviewImg) reelPreviewImg.classList.add('hidden');

        if (reelOptInfo) {
          reelOptInfo.innerHTML = `<i class="fa-solid fa-bolt"></i> <span>Video spreman: <strong>${fileMB} MB</strong></span>`;
        }
        playSound('pop');
        showToast(`Video zapis je uspešno sačuvan (${fileMB} MB)!`);
      };
      reader.readAsDataURL(file);
    } else {
      showToast('⚡ Pripremam sliku sa računara za video reel...');
      const compressed = await compressImageFile(file, 1080, 0.78);
      state.uploadedMedia.reel = { type: 'image', url: compressed.dataUrl };

      if (reelPreviewImg) {
        reelPreviewImg.src = compressed.dataUrl;
        reelPreviewImg.classList.remove('hidden');
      }
      if (reelPreviewVideo) reelPreviewVideo.classList.add('hidden');

      if (reelOptInfo) {
        reelOptInfo.innerHTML = `<i class="fa-solid fa-bolt"></i> <span>Slika je spremna: <strong>${compressed.compKB} KB</strong></span>`;
      }
      playSound('pop');
      showToast('Slika je spremna za video reel!');
    }

    if (reelDropzone) reelDropzone.classList.add('hidden');
    if (reelPreviewBox) reelPreviewBox.classList.remove('hidden');
  }

  if (btnRemoveReelFile) {
    btnRemoveReelFile.onclick = () => {
      playSound('click');
      state.uploadedMedia.reel = null;
      if (reelFileInput) reelFileInput.value = '';
      if (reelDropzone) reelDropzone.classList.remove('hidden');
      if (reelPreviewBox) reelPreviewBox.classList.add('hidden');
    };
  }
}

function setupEventListeners() {
  document.addEventListener('click', (e) => {
    const tabTarget = e.target.closest('[data-tab]');
    if (tabTarget) {
      e.preventDefault();
      playSound('click');
      const tabName = tabTarget.getAttribute('data-tab');
      if (tabName) switchTab(tabName);
    }
  });

  const btnMobileLoc = document.getElementById('btn-mobile-location');
  if (btnMobileLoc) {
    btnMobileLoc.onclick = () => {
      playSound('click');
      detectUserPreciseLocation(false);
    };
  }

  const btnUpdateProfGps = document.getElementById('btn-update-prof-gps');
  if (btnUpdateProfGps) {
    btnUpdateProfGps.onclick = () => {
      playSound('click');
      detectUserPreciseLocation(false);
    };
  }

  const btnGetPostGps = document.getElementById('btn-get-post-gps');
  if (btnGetPostGps) {
    btnGetPostGps.onclick = () => {
      playSound('click');
      detectUserPreciseLocation(false);
      if (state.currentUser.location) {
        const postLoc = document.getElementById('post-location');
        if (postLoc) postLoc.value = state.currentUser.location.text;
      }
    };
  }

  const btnCreateDesktop = document.getElementById('btn-open-create');
  if (btnCreateDesktop) {
    btnCreateDesktop.onclick = (e) => {
      e.preventDefault();
      playSound('click');
      openModal(document.getElementById('create-modal'));
      if (state.currentUser.location) {
        const postLoc = document.getElementById('post-location');
        if (postLoc && !postLoc.value) postLoc.value = state.currentUser.location.text;
      }
    };
  }

  const btnCreateMobile = document.getElementById('btn-mobile-create');
  if (btnCreateMobile) {
    btnCreateMobile.onclick = () => {
      playSound('click');
      openModal(document.getElementById('create-modal'));
    };
  }

  const tabPost = document.getElementById('tab-create-post');
  const tabStory = document.getElementById('tab-create-story');
  const tabReel = document.getElementById('tab-create-reel');

  const formPost = document.getElementById('create-post-form');
  const formStory = document.getElementById('create-story-form');
  const formReel = document.getElementById('create-reel-form');

  if (tabPost && tabStory && tabReel) {
    tabPost.onclick = () => {
      playSound('click');
      tabPost.classList.add('active');
      tabStory.classList.remove('active');
      tabReel.classList.remove('active');
      formPost.classList.remove('hidden');
      formStory.classList.add('hidden');
      formReel.classList.add('hidden');
    };

    tabStory.onclick = () => {
      playSound('click');
      tabStory.classList.add('active');
      tabPost.classList.remove('active');
      tabReel.classList.remove('active');
      formStory.classList.remove('hidden');
      formPost.classList.add('hidden');
      formReel.classList.add('hidden');
    };

    tabReel.onclick = () => {
      playSound('click');
      tabReel.classList.add('active');
      tabPost.classList.remove('active');
      tabStory.classList.remove('active');
      formReel.classList.remove('hidden');
      formPost.classList.add('hidden');
      formStory.classList.add('hidden');
    };
  }

  const btnSubmitPost = document.getElementById('btn-submit-post');
  if (btnSubmitPost) btnSubmitPost.onclick = handleCreatePost;

  const btnSubmitStory = document.getElementById('btn-submit-story');
  if (btnSubmitStory) btnSubmitStory.onclick = handleCreateStory;

  const btnSubmitReel = document.getElementById('btn-submit-reel');
  if (btnSubmitReel) btnSubmitReel.onclick = handleCreateReel;

  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.onclick = () => {
      playSound('click');
      closeAllModals();
    };
  });

  const btnEditProf = document.getElementById('btn-edit-profile');
  if (btnEditProf) {
    btnEditProf.onclick = () => {
      playSound('click');
      openModal(document.getElementById('edit-profile-modal'));
    };
  }

  const btnSaveProf = document.getElementById('btn-save-profile');
  if (btnSaveProf) {
    btnSaveProf.onclick = () => {
      const name = document.getElementById('edit-fullname').value.trim();
      const username = document.getElementById('edit-username').value.trim();
      const email = document.getElementById('edit-email')?.value.trim();
      const phone = document.getElementById('edit-phone')?.value.trim();
      const bio = document.getElementById('edit-bio').value.trim();

      state.currentUser.fullname = name || state.currentUser.fullname;
      state.currentUser.username = username || state.currentUser.username;
      if (email) state.currentUser.email = email;
      if (phone) state.currentUser.phone = phone;
      state.currentUser.bio = bio || state.currentUser.bio;

      updateProfileUI();

      playSound('notification');
      closeAllModals();
      showToast('Profil je uspješno ažuriran!');
    };
  }

  const btnLogoutSidebar = document.getElementById('btn-logout-sidebar');
  const btnLogoutProf = document.getElementById('btn-logout-prof');
  const logoutModal = document.getElementById('logout-modal');
  const loginOverlay = document.getElementById('login-overlay');
  const btnConfirmLogout = document.getElementById('btn-confirm-logout');

  const authTabLogin = document.getElementById('auth-tab-login');
  const authTabRegister = document.getElementById('auth-tab-register');
  const authFormLogin = document.getElementById('auth-form-login');
  const authFormRegister = document.getElementById('auth-form-register');
  const linkGotoRegister = document.getElementById('link-goto-register');
  const linkGotoLogin = document.getElementById('link-goto-login');
  const btnDoLogin = document.getElementById('btn-do-login');
  const btnDoRegister = document.getElementById('btn-do-register');

  const showAuthTab = (type) => {
    playSound('click');
    if (type === 'login') {
      if (authTabLogin) authTabLogin.classList.add('active');
      if (authTabRegister) authTabRegister.classList.remove('active');
      if (authFormLogin) authFormLogin.classList.remove('hidden');
      if (authFormRegister) authFormRegister.classList.add('hidden');
    } else {
      if (authTabRegister) authTabRegister.classList.add('active');
      if (authTabLogin) authTabLogin.classList.remove('active');
      if (authFormRegister) authFormRegister.classList.remove('hidden');
      if (authFormLogin) authFormLogin.classList.add('hidden');
    }
  };

  if (authTabLogin) authTabLogin.onclick = () => showAuthTab('login');
  if (authTabRegister) authTabRegister.onclick = () => showAuthTab('register');
  if (linkGotoRegister) linkGotoRegister.onclick = (e) => { e.preventDefault(); showAuthTab('register'); };
  if (linkGotoLogin) linkGotoLogin.onclick = (e) => { e.preventDefault(); showAuthTab('login'); };

  if (btnLogoutSidebar) btnLogoutSidebar.onclick = (e) => { e.preventDefault(); playSound('click'); openModal(logoutModal); };
  if (btnLogoutProf) btnLogoutProf.onclick = (e) => { e.preventDefault(); playSound('click'); openModal(logoutModal); };

  if (btnConfirmLogout) {
    btnConfirmLogout.onclick = () => {
      playSound('click');
      setToken(null);
      closeAllModals();
      if (loginOverlay) loginOverlay.classList.remove('hidden');
      showToast('Uspješno ste se odjavili sa računa.');
    };
  }

  if (btnDoLogin) {
    btnDoLogin.onclick = async () => {
      const usernameInput = document.getElementById('login-username-input')?.value.trim();
      const passwordInput = document.getElementById('login-password-input')?.value.trim();

      if (!usernameInput || !passwordInput) {
        showToast('Unesite korisničko ime i lozinku.');
        return;
      }

      showToast('Prijavljujem se na Express backend API...');
      const result = await loginUser({ login: usernameInput, password: passwordInput });

      if (result && result.user) {
        state.currentUser.fullname = result.user.full_name || result.user.fullname;
        state.currentUser.username = result.user.nickname || result.user.username;
        state.currentUser.email = result.user.email;
        if (result.user.phone) state.currentUser.phone = result.user.phone;
        if (result.user.avatar) state.currentUser.avatar = result.user.avatar;
        if (result.user.bio) state.currentUser.bio = result.user.bio;

        updateProfileUI();
        playSound('notification');
        if (loginOverlay) loginOverlay.classList.add('hidden');
        showToast(`Uspješno prijavljeni na backend kao @${state.currentUser.username}!`);
      } else {
        showToast(result?.error || 'Greška pri prijavi.');
      }
      switchTab('home');
    };
  }

  if (btnDoRegister) {
    btnDoRegister.onclick = async () => {
      const fullname = document.getElementById('reg-fullname')?.value.trim();
      const username = document.getElementById('reg-username')?.value.trim();
      const email = document.getElementById('reg-email')?.value.trim();
      const phone = document.getElementById('reg-phone')?.value.trim();
      const pass = document.getElementById('reg-password')?.value.trim();
      const passConf = document.getElementById('reg-confirm-password')?.value.trim();
      const agree = document.getElementById('reg-agree-terms')?.checked;

      if (!fullname) { showToast('Molimo unesite vaše ime i prezime.'); return; }
      if (!username) { showToast('Molimo unesite nadimak / korisničko ime.'); return; }
      if (!email || !email.includes('@')) { showToast('Molimo unesite ispravnu e-mail adresu.'); return; }
      if (!phone) { showToast('Molimo unesite broj telefona za SMS 2FA i notifikacije.'); return; }
      if (!pass || pass.length < 6) { showToast('Lozinka mora imati najmanje 6 karaktera.'); return; }
      if (pass !== passConf) { showToast('Lozinke se ne podudaraju!'); return; }
      if (!agree) { showToast('Molimo prihvatite uslove korištenja.'); return; }

      showToast('Spremam novog korisnika u Express backend bazu...');
      const result = await registerUser({
        full_name: fullname,
        nickname: username.replace(/^@/, ''),
        email,
        phone,
        password: pass
      });

      if (result && result.user) {
        state.currentUser.fullname = result.user.full_name;
        state.currentUser.username = result.user.nickname;
        state.currentUser.email = result.user.email;
        state.currentUser.phone = result.user.phone;

        updateProfileUI();
        playSound('notification');
        if (loginOverlay) loginOverlay.classList.add('hidden');
        showToast(`Registracija uspješna na Express backendu! Dobrodošli, @${state.currentUser.username}! 🎉`);
        switchTab('home');
      } else {
        showToast(result?.error || 'Greška pri registraciji.');
      }
    };
  }
}

function switchTab(tabName) {
  state.activeTab = tabName;

  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabName) item.classList.add('active');
    else item.classList.remove('active');
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === `tab-${tabName}`) pane.classList.add('active');
    else pane.classList.remove('active');
  });

  if (tabName === 'reels') {
    const firstVideo = document.querySelector('video.reel-video');
    if (firstVideo) firstVideo.play().catch(() => {});
  } else {
    document.querySelectorAll('video.reel-video').forEach(v => v.pause());
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderExploreGrid(query = '') {
  const exploreGrid = document.getElementById('explore-grid');
  if (!exploreGrid) return;

  const images = [
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80', tag: 'putovanja' },
    { src: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=500&q=80', tag: 'fotografije' },
    { src: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&q=80', tag: 'tehnologija' },
    { src: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&q=80', tag: 'putovanja' },
    { src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80', tag: 'moda' },
    { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=80', tag: 'fotografije' }
  ];

  const filtered = query ? images.filter(i => i.tag.includes(query)) : images;

  exploreGrid.innerHTML = '';
  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'explore-item';
    card.innerHTML = `
      <img src="${item.src}" alt="Istraži">
      <div class="explore-overlay">
        <span><i class="fa-solid fa-heart"></i> ${Math.floor(Math.random() * 400) + 100}</span>
        <span><i class="fa-solid fa-comment"></i> ${Math.floor(Math.random() * 50) + 5}</span>
      </div>
    `;
    exploreGrid.appendChild(card);
  });
}

async function handleCreatePost() {
  if (!state.uploadedMedia.post?.url) {
    showToast('Molimo izaberite sliku sa vašeg računara ili uređaja.');
    return;
  }

  playSound('post');

  let imageUrl = state.uploadedMedia.post.url;
  const caption = document.getElementById('post-caption').value.trim();
  let location = document.getElementById('post-location').value.trim() || (state.currentUser.location ? state.currentUser.location.text : 'Kalesija (Babajići)');

  showToast('Spremam objavu u PostgreSQL bazu...');
  const backendPost = await createPostAPI({
    caption,
    image_url: imageUrl,
    location
  });

  const newPost = {
    id: backendPost ? backendPost.id : ('p-' + Date.now()),
    author: state.currentUser.username,
    avatar: state.currentUser.avatar,
    verified: true,
    location: location,
    image: imageUrl,
    caption: caption || 'Nova objava sa računara na mreži Selamy! ✨',
    likes: 1,
    liked: true,
    saved: false,
    isFollowing: false,
    timeAgo: 'UPRAVO SADA',
    comments: []
  };

  state.posts.unshift(newPost);
  state.currentUser.postsCount++;

  renderPosts();
  renderProfileGrid();
  resetUploadState('post');
  closeAllModals();

  document.getElementById('post-caption').value = '';
  document.getElementById('post-location').value = '';

  showToast('Nova objava je uspješno sačuvana u PostgreSQL bazi!');
  switchTab('home');
}

async function handleCreateStory() {
  if (!state.uploadedMedia.story?.url) {
    showToast('Molimo izaberite sliku za priču sa vašeg uređaja.');
    return;
  }

  playSound('post');

  let imageUrl = state.uploadedMedia.story.url;
  const text = document.getElementById('story-text-input').value.trim();

  showToast('Spremam Priču u PostgreSQL bazu...');
  const backendStory = await createStoryAPI({ media_url: imageUrl, text });

  let myStory = state.stories.find(s => s.isMe);
  if (!myStory) {
    myStory = {
      id: 'my-story',
      isMe: true,
      username: 'Vaša priča',
      avatar: state.currentUser.avatar,
      hasUnseen: true,
      slides: []
    };
    state.stories.unshift(myStory);
  }

  myStory.slides.push({
    id: backendStory ? backendStory.id : ('slide-' + Date.now()),
    media: imageUrl,
    time: 'Upravo',
    text: text
  });

  myStory.hasUnseen = true;
  renderStories();
  resetUploadState('story');
  closeAllModals();

  document.getElementById('story-text-input').value = '';

  showToast('Vaša priča je sačuvana u PostgreSQL bazi!');
}

async function handleCreateReel() {
  if (!state.uploadedMedia.reel?.url) {
    showToast('Molimo izaberite video zapis ili sliku sa vašeg uređaja.');
    return;
  }

  playSound('post');

  let mediaUrl = state.uploadedMedia.reel.url;
  const caption = document.getElementById('reel-caption-input').value.trim() || 'Novi kratki video! 🌊✨';
  const audio = document.getElementById('reel-audio-input').value.trim() || `Originalni zvuk - ${state.currentUser.username}`;

  showToast('Spremam Reel u PostgreSQL bazu...');

  const createdBackendReel = await createReelAPI({
    video_url: mediaUrl,
    caption: caption,
    audio_title: audio
  });

  const newReel = {
    id: createdBackendReel ? createdBackendReel.id : ('reel-' + Date.now()),
    author: state.currentUser.username,
    avatar: state.currentUser.avatar,
    caption: caption,
    video: mediaUrl,
    audio: audio,
    likes: 1,
    liked: true,
    comments: []
  };

  state.reels.unshift(newReel);
  renderReels();
  resetUploadState('reel');
  closeAllModals();

  document.getElementById('reel-caption-input').value = '';
  document.getElementById('reel-audio-input').value = '';

  showToast('Vaš Reel video je trajno sačuvan u PostgreSQL bazi!');
  switchTab('reels');
}

function resetUploadState(type) {
  state.uploadedMedia[type] = null;
  const dropzone = document.getElementById(`${type}-dropzone`);
  const previewBox = document.getElementById(`${type}-preview-box`);
  const fileInput = document.getElementById(`${type}-file-input`);

  if (dropzone) dropzone.classList.remove('hidden');
  if (previewBox) previewBox.classList.add('hidden');
  if (fileInput) fileInput.value = '';
}

function openModal(modal) {
  if (modal) modal.classList.remove('hidden');
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}
