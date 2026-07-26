// SELAMY - MAIN ENTRY (COOKIE AUTHENTICATION + POSTGRESQL SYNC)

import { state } from './src/js/state.js';
import { compressImageFile, showToast } from './src/js/utils/compressor.js';
import { playSound } from './src/js/utils/sound.js';
import { initPrayerTimesService, detectUserPreciseLocation } from './src/js/services/prayerTimes.js';
import { initForumModule } from './src/js/modules/forum.js';
import { initChallengesModule } from './src/js/modules/challenges.js';
import { initStoriesModule, renderStories } from './src/js/modules/stories.js';
import { initReelsModule, renderReels } from './src/js/modules/reels.js';
import { initFeedModule, renderPosts } from './src/js/modules/feed.js';
import { initChatModule } from './src/js/modules/chat.js';
import { initProfileModule, renderProfileGrid } from './src/js/modules/profile.js';
import { registerUser, loginUser, logoutUser, fetchCurrentUser, createReelAPI, createPostAPI, createStoryAPI } from './src/js/services/api.js';

document.addEventListener('DOMContentLoaded', initApp);
if (document.readyState !== 'loading') initApp();

async function initApp() {
  detectUserPreciseLocation(true);

  // Check auth session via /api/me (Cookie)
  const user = await fetchCurrentUser();
  const lo = document.getElementById('login-overlay');

  if (user) {
    state.currentUser.loggedIn = true;
    state.currentUser.id = user.id;
    state.currentUser.fullname = user.full_name || user.fullname;
    state.currentUser.username = user.nickname || user.username;
    state.currentUser.email = user.email;
    if (user.phone) state.currentUser.phone = user.phone;
    if (user.bio) state.currentUser.bio = user.bio;
    if (user.avatar) state.currentUser.avatar = user.avatar;
    updateProfileUI();
    if (lo) lo.classList.add('hidden');
  } else {
    state.currentUser.loggedIn = false;
    state.currentUser.id = null;
    state.currentUser.username = '';
    state.currentUser.fullname = '';
    if (lo) lo.classList.remove('hidden');
  }

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
}

function updateProfileUI() {
  const pu = document.querySelector('.profile-username');
  if (pu) {
    if (state.currentUser.username) {
      pu.innerHTML = `${state.currentUser.username} <i class="fa-solid fa-circle-check verified-badge"></i>`;
    } else {
      pu.textContent = 'Gost (Neprijavljen)';
    }
  }

  const fn = document.querySelector('.full-name');
  if (fn) fn.textContent = state.currentUser.fullname || 'Neprijavljeni korisnik';

  ['edit-fullname','edit-username','edit-email','edit-phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = state.currentUser[id.replace('edit-','')] || '';
  });
}

// ======== FILE UPLOAD ========
function setupFileUploadListeners() {
  // POST
  const pf = document.getElementById('post-file-input'), pd = document.getElementById('post-dropzone'), pbtn = document.getElementById('btn-select-post-file'), ppb = document.getElementById('post-preview-box'), ppi = document.getElementById('post-preview-img'), poi = document.getElementById('post-opt-info'), prm = document.getElementById('btn-remove-post-file');
  if (pbtn&&pf) pbtn.onclick = e => { e.stopPropagation(); playSound('click'); pf.click(); };
  if (pd&&pf) { pd.onclick = () => { playSound('click'); pf.click(); }; ['dragenter','dragover'].forEach(ev => pd.addEventListener(ev, e => { e.preventDefault(); pd.classList.add('dragover'); })); ['dragleave','drop'].forEach(ev => pd.addEventListener(ev, e => { e.preventDefault(); pd.classList.remove('dragover'); })); pd.addEventListener('drop', e => { const f = e.dataTransfer?.files?.[0]; if (f) handlePostFile(f); }); pf.onchange = e => { if (e.target.files?.[0]) handlePostFile(e.target.files[0]); }; }
  async function handlePostFile(f) { if (!f.type.startsWith('image/')) { showToast('Odaberite sliku.'); return; } try { showToast('⚡ Sažimam...'); const c = await compressImageFile(f,1080,0.78); state.uploadedMedia.post={type:'image',url:c.dataUrl}; if(ppi)ppi.src=c.dataUrl; if(poi)poi.innerHTML=`<i class="fa-solid fa-bolt"></i> <span>${c.origKB}KB → <strong>${c.compKB}KB</strong> (${c.savings}% uštede)</span>`; if(pd)pd.classList.add('hidden'); if(ppb)ppb.classList.remove('hidden'); playSound('pop'); showToast(`Spremno (${c.savings}% uštede)!`); } catch { showToast('Greška.'); } }
  if (prm) prm.onclick = () => { playSound('click'); state.uploadedMedia.post=null; pf.value=''; pd.classList.remove('hidden'); ppb.classList.add('hidden'); };

  // STORY
  const sf = document.getElementById('story-file-input'), sd = document.getElementById('story-dropzone'), sbtn = document.getElementById('btn-select-story-file'), spb = document.getElementById('story-preview-box'), spi = document.getElementById('story-preview-img'), soi = document.getElementById('story-opt-info'), srm = document.getElementById('btn-remove-story-file');
  if (sbtn&&sf) sbtn.onclick = e => { e.stopPropagation(); playSound('click'); sf.click(); };
  if (sd&&sf) { sd.onclick = () => { playSound('click'); sf.click(); }; ['dragenter','dragover'].forEach(ev => sd.addEventListener(ev, e => { e.preventDefault(); sd.classList.add('dragover'); })); ['dragleave','drop'].forEach(ev => sd.addEventListener(ev, e => { e.preventDefault(); sd.classList.remove('dragover'); })); sd.addEventListener('drop', e => { const f = e.dataTransfer?.files?.[0]; if (f) handleStoryFile(f); }); sf.onchange = e => { if (e.target.files?.[0]) handleStoryFile(e.target.files[0]); }; }
  async function handleStoryFile(f) { if (!f.type.startsWith('image/')) { showToast('Odaberite sliku.'); return; } try { showToast('⚡ Pripremam...'); const c = await compressImageFile(f,1080,0.78); state.uploadedMedia.story={type:'image',url:c.dataUrl}; if(spi)spi.src=c.dataUrl; if(soi)soi.innerHTML=`<i class="fa-solid fa-bolt"></i> <span>${c.origKB}KB → <strong>${c.compKB}KB</strong> (${c.savings}% uštede)</span>`; if(sd)sd.classList.add('hidden'); if(spb)spb.classList.remove('hidden'); playSound('pop'); showToast(`Spremno (${c.savings}% uštede)!`); } catch { showToast('Greška.'); } }
  if (srm) srm.onclick = () => { playSound('click'); state.uploadedMedia.story=null; sf.value=''; sd.classList.remove('hidden'); spb.classList.add('hidden'); };

  // REEL
  const rf = document.getElementById('reel-file-input'), rd = document.getElementById('reel-dropzone'), rbtn = document.getElementById('btn-select-reel-file'), rpb = document.getElementById('reel-preview-box'), rpv = document.getElementById('reel-preview-video'), rpi = document.getElementById('reel-preview-img'), roi = document.getElementById('reel-opt-info'), rrm = document.getElementById('btn-remove-reel-file');
  if (rbtn&&rf) rbtn.onclick = e => { e.stopPropagation(); playSound('click'); rf.click(); };
  if (rd&&rf) { rd.onclick = () => { playSound('click'); rf.click(); }; ['dragenter','dragover'].forEach(ev => rd.addEventListener(ev, e => { e.preventDefault(); rd.classList.add('dragover'); })); ['dragleave','drop'].forEach(ev => rd.addEventListener(ev, e => { e.preventDefault(); rd.classList.remove('dragover'); })); rd.addEventListener('drop', e => { const f = e.dataTransfer?.files?.[0]; if (f) handleReelFile(f); }); rf.onchange = e => { if (e.target.files?.[0]) handleReelFile(e.target.files[0]); }; }
  async function handleReelFile(f) {
    const isV = f.type.startsWith('video/'), isI = f.type.startsWith('image/');
    if (!isV&&!isI) { showToast('Odaberite video ili sliku.'); return; }
    const mb = (f.size/(1024*1024)).toFixed(1);
    if (isV) {
      const blobUrl = URL.createObjectURL(f);
      state.uploadedMedia.reel = { type: 'video', url: blobUrl, isLocalVideo: true };
      if (rpv) { rpv.src = blobUrl; rpv.classList.remove('hidden'); }
      if (rpi) rpi.classList.add('hidden');
      if (roi) roi.innerHTML = `<i class="fa-solid fa-film"></i> <span>Video: <strong>${mb} MB</strong> (lokalni blob)</span>`;
      playSound('pop'); showToast(`Video spreman (${mb} MB)!`);
    } else {
      showToast('⚡ Sažimam sliku...');
      const c = await compressImageFile(f,1080,0.78);
      state.uploadedMedia.reel = { type: 'image', url: c.dataUrl };
      if (rpi) { rpi.src = c.dataUrl; rpi.classList.remove('hidden'); }
      if (rpv) rpv.classList.add('hidden');
      if (roi) roi.innerHTML = `<i class="fa-solid fa-bolt"></i> <span>Slika: <strong>${c.compKB} KB</strong></span>`;
      playSound('pop'); showToast('Slika spremna!');
    }
    if (rd) rd.classList.add('hidden'); if (rpb) rpb.classList.remove('hidden');
  }
  if (rrm) rrm.onclick = () => { playSound('click'); state.uploadedMedia.reel=null; rf.value=''; rd.classList.remove('hidden'); rpb.classList.add('hidden'); };
}

// ======== EVENTS ========
function setupEventListeners() {
  document.addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) { e.preventDefault(); playSound('click'); switchTab(t.getAttribute('data-tab')); } });
  document.getElementById('btn-mobile-location')?.addEventListener('click', () => { playSound('click'); detectUserPreciseLocation(false); });
  document.getElementById('btn-update-prof-gps')?.addEventListener('click', () => { playSound('click'); detectUserPreciseLocation(false); });
  document.getElementById('btn-get-post-gps')?.addEventListener('click', () => { playSound('click'); detectUserPreciseLocation(false); if (state.currentUser.location) { const pl = document.getElementById('post-location'); if (pl) pl.value = state.currentUser.location.text; } });
  
  const checkAuthAndOpenCreate = (e) => {
    if (e) e.preventDefault();
    if (!state.currentUser.loggedIn) {
      showToast('Molimo prijavite se da biste objavljivali.');
      document.getElementById('login-overlay')?.classList.remove('hidden');
      return;
    }
    playSound('click');
    openModal(document.getElementById('create-modal'));
    if (state.currentUser.location) {
      const pl = document.getElementById('post-location');
      if (pl && !pl.value) pl.value = state.currentUser.location.text;
    }
  };

  document.getElementById('btn-open-create')?.addEventListener('click', checkAuthAndOpenCreate);
  document.getElementById('btn-mobile-create')?.addEventListener('click', checkAuthAndOpenCreate);

  const tp=document.getElementById('tab-create-post'),ts=document.getElementById('tab-create-story'),tr=document.getElementById('tab-create-reel'),fp=document.getElementById('create-post-form'),fs=document.getElementById('create-story-form'),fr=document.getElementById('create-reel-form');
  if(tp&&ts&&tr){tp.onclick=()=>{playSound('click');tp.classList.add('active');ts.classList.remove('active');tr.classList.remove('active');fp.classList.remove('hidden');fs.classList.add('hidden');fr.classList.add('hidden');};ts.onclick=()=>{playSound('click');ts.classList.add('active');tp.classList.remove('active');tr.classList.remove('active');fs.classList.remove('hidden');fp.classList.add('hidden');fr.classList.add('hidden');};tr.onclick=()=>{playSound('click');tr.classList.add('active');tp.classList.remove('active');ts.classList.remove('active');fr.classList.remove('hidden');fp.classList.add('hidden');fs.classList.add('hidden');};}

  document.getElementById('btn-submit-post')?.addEventListener('click', handleCreatePost);
  document.getElementById('btn-submit-story')?.addEventListener('click', handleCreateStory);
  document.getElementById('btn-submit-reel')?.addEventListener('click', handleCreateReel);
  document.querySelectorAll('.btn-close-modal').forEach(b => b.onclick = () => { playSound('click'); closeAllModals(); });
  document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
    if (!state.currentUser.loggedIn) {
      showToast('Molimo prijavite se.');
      document.getElementById('login-overlay')?.classList.remove('hidden');
      return;
    }
    playSound('click'); openModal(document.getElementById('edit-profile-modal'));
  });
  document.getElementById('btn-save-profile')?.addEventListener('click', () => { const n=document.getElementById('edit-fullname').value.trim(),u=document.getElementById('edit-username').value.trim(),e=document.getElementById('edit-email')?.value.trim(),p=document.getElementById('edit-phone')?.value.trim(),b=document.getElementById('edit-bio').value.trim(); state.currentUser.fullname=n||state.currentUser.fullname; state.currentUser.username=u||state.currentUser.username; if(e)state.currentUser.email=e; if(p)state.currentUser.phone=p; state.currentUser.bio=b||state.currentUser.bio; updateProfileUI(); playSound('notification'); closeAllModals(); showToast('Profil ažuriran!'); });

  // Auth
  const lo=document.getElementById('login-overlay'),lm=document.getElementById('logout-modal');
  document.getElementById('btn-logout-sidebar')?.addEventListener('click', e => { e.preventDefault(); playSound('click'); openModal(lm); });
  document.getElementById('btn-logout-prof')?.addEventListener('click', e => { e.preventDefault(); playSound('click'); openModal(lm); });
  document.getElementById('btn-confirm-logout')?.addEventListener('click', async () => {
    playSound('click');
    await logoutUser();
    state.currentUser.loggedIn = false;
    state.currentUser.id = null;
    state.currentUser.username = '';
    state.currentUser.fullname = '';
    state.currentUser.email = '';
    state.currentUser.phone = '';
    state.currentUser.bio = '';
    updateProfileUI();
    closeAllModals();
    if (lo) lo.classList.remove('hidden');
    showToast('Odjavljeni ste.');
  });

  const atl=document.getElementById('auth-tab-login'),atr=document.getElementById('auth-tab-register'),afl=document.getElementById('auth-form-login'),afr=document.getElementById('auth-form-register');
  const showAT = type => { playSound('click'); if(type==='login'){atl.classList.add('active');atr.classList.remove('active');afl.classList.remove('hidden');afr.classList.add('hidden');}else{atr.classList.add('active');atl.classList.remove('active');afr.classList.remove('hidden');afl.classList.add('hidden');} };
  atl?.addEventListener('click',()=>showAT('login')); atr?.addEventListener('click',()=>showAT('register'));
  document.getElementById('link-goto-register')?.addEventListener('click',e=>{e.preventDefault();showAT('register');});
  document.getElementById('link-goto-login')?.addEventListener('click',e=>{e.preventDefault();showAT('login');});

  document.getElementById('btn-do-login')?.addEventListener('click', async () => {
    const u=document.getElementById('login-username-input')?.value.trim(),p=document.getElementById('login-password-input')?.value.trim();
    if(!u||!p){showToast('Unesite korisničko ime/email i lozinku.');return;}
    showToast('Prijavljujem se...');
    const r = await loginUser({ login: u, password: p });
    if(r?.user) {
      state.currentUser.loggedIn = true;
      state.currentUser.id = r.user.id;
      state.currentUser.fullname = r.user.full_name || r.user.fullname;
      state.currentUser.username = r.user.nickname || r.user.username;
      state.currentUser.email = r.user.email;
      if (r.user.phone) state.currentUser.phone = r.user.phone;
      if (r.user.avatar) state.currentUser.avatar = r.user.avatar;
      if (r.user.bio) state.currentUser.bio = r.user.bio;
      updateProfileUI();
      playSound('notification');
      if (lo) lo.classList.add('hidden');
      showToast(`Dobrodošli, @${state.currentUser.username}!`);
      await initFeedModule();
      await initStoriesModule();
      await initReelsModule();
      await initForumModule();
      renderProfileGrid();
      switchTab('home');
    } else {
      showToast(r?.error || 'Greška pri prijavi.');
    }
  });

  document.getElementById('btn-do-register')?.addEventListener('click', async () => {
    const fn=document.getElementById('reg-fullname')?.value.trim(),un=document.getElementById('reg-username')?.value.trim(),em=document.getElementById('reg-email')?.value.trim(),ph=document.getElementById('reg-phone')?.value.trim(),pw=document.getElementById('reg-password')?.value.trim(),pc=document.getElementById('reg-confirm-password')?.value.trim(),ag=document.getElementById('reg-agree-terms')?.checked;
    if(!fn){showToast('Unesite ime i prezime.');return;}if(!un){showToast('Unesite nadimak.');return;}if(!em||!em.includes('@')){showToast('Unesite ispravan email.');return;}if(!ph){showToast('Unesite broj telefona.');return;}if(!pw||pw.length<6){showToast('Lozinka min 6 karaktera.');return;}if(pw!==pc){showToast('Lozinke se ne podudaraju!');return;}if(!ag){showToast('Prihvatite uslove.');return;}
    showToast('Registrujem...');
    const r = await registerUser({ full_name: fn, nickname: un.replace(/^@/,''), email: em, phone: ph, password: pw });
    if(r?.user) {
      state.currentUser.loggedIn = true;
      state.currentUser.id = r.user.id;
      state.currentUser.fullname = r.user.full_name;
      state.currentUser.username = r.user.nickname;
      state.currentUser.email = r.user.email;
      state.currentUser.phone = r.user.phone;
      updateProfileUI();
      playSound('notification');
      if(lo)lo.classList.add('hidden');
      showToast(`Registracija uspješna! Dobrodošli, @${state.currentUser.username}! 🎉`);
      await initFeedModule();
      await initStoriesModule();
      await initReelsModule();
      await initForumModule();
      renderProfileGrid();
      switchTab('home');
    } else {
      showToast(r?.error || 'Greška pri registraciji.');
    }
  });
}

function switchTab(tab) { state.activeTab=tab; document.querySelectorAll('.nav-item').forEach(i=>i.classList.toggle('active',i.getAttribute('data-tab')===tab)); document.querySelectorAll('.tab-pane').forEach(p=>p.classList.toggle('active',p.id===`tab-${tab}`)); if(tab==='reels'){const v=document.querySelector('video.reel-video');if(v)v.play().catch(()=>{});}else{document.querySelectorAll('video.reel-video').forEach(v=>v.pause());} window.scrollTo({top:0,behavior:'smooth'}); }

function renderExploreGrid(q='') { const g=document.getElementById('explore-grid'); if(!g)return; const imgs=[{s:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',t:'putovanja'},{s:'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=500&q=80',t:'fotografije'},{s:'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&q=80',t:'tehnologija'},{s:'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&q=80',t:'putovanja'},{s:'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80',t:'moda'},{s:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=80',t:'fotografije'}]; const f=q?imgs.filter(i=>i.t.includes(q)):imgs; g.innerHTML=''; f.forEach(i=>{const c=document.createElement('div');c.className='explore-item';c.innerHTML=`<img src="${i.s}" alt=""><div class="explore-overlay"><span><i class="fa-solid fa-heart"></i> ${Math.floor(Math.random()*400)+100}</span><span><i class="fa-solid fa-comment"></i> ${Math.floor(Math.random()*50)+5}</span></div>`;g.appendChild(c);}); }

async function handleCreatePost() {
  if (!state.currentUser.loggedIn) {
    showToast('Molimo prijavite se.');
    document.getElementById('login-overlay')?.classList.remove('hidden');
    return;
  }
  if (!state.uploadedMedia.post?.url) { showToast('Izaberite sliku.'); return; }
  playSound('post');
  const u = state.uploadedMedia.post.url, c = document.getElementById('post-caption').value.trim(), l = document.getElementById('post-location').value.trim() || (state.currentUser.location?.text || 'Kalesija (Babajići)');
  showToast('Spremam...');
  const bp = await createPostAPI({ caption: c, image_url: u, location: l });
  if (bp) {
    state.posts.unshift({
      id: bp.id, author: state.currentUser.username, avatar: state.currentUser.avatar,
      verified: true, location: l, image: u, caption: c || 'Nova objava! ✨',
      likes: 0, likedByMe: false, saved: false, timeAgo: 'UPRAVO SADA', comments: []
    });
    renderPosts(); renderProfileGrid(); resetUploadState('post'); closeAllModals();
    document.getElementById('post-caption').value = ''; document.getElementById('post-location').value = '';
    showToast('Objava sačuvana u bazi!'); switchTab('home');
  } else {
    showToast('Niste prijavljeni ili je došlo do greške.');
  }
}

async function handleCreateStory() {
  if (!state.currentUser.loggedIn) {
    showToast('Molimo prijavite se.');
    document.getElementById('login-overlay')?.classList.remove('hidden');
    return;
  }
  if (!state.uploadedMedia.story?.url) { showToast('Izaberite sliku.'); return; }
  playSound('post');
  const u = state.uploadedMedia.story.url, t = document.getElementById('story-text-input').value.trim();
  showToast('Spremam...');
  const bs = await createStoryAPI({ media_url: u, text: t });
  if (bs) {
    let my = state.stories.find(s => s.isMe);
    if (!my) { my = { id: 'my-story', isMe: true, username: 'Vaša priča', avatar: state.currentUser.avatar, hasUnseen: true, slides: [] }; state.stories.unshift(my); }
    my.slides.push({ id: bs.id, media: u, time: 'Upravo', text: t });
    my.hasUnseen = true;
    renderStories(); resetUploadState('story'); closeAllModals();
    document.getElementById('story-text-input').value = '';
    showToast('Priča sačuvana u bazi!');
  } else {
    showToast('Niste prijavljeni ili je došlo do greške.');
  }
}

async function handleCreateReel() {
  if (!state.currentUser.loggedIn) {
    showToast('Molimo prijavite se.');
    document.getElementById('login-overlay')?.classList.remove('hidden');
    return;
  }
  if (!state.uploadedMedia.reel?.url) { showToast('Izaberite video ili sliku.'); return; }
  playSound('post');
  const u = state.uploadedMedia.reel.url, c = document.getElementById('reel-caption-input').value.trim() || 'Novi kratki video! ✨', a = document.getElementById('reel-audio-input').value.trim() || `Zvuk - ${state.currentUser.username}`;
  showToast('Spremam Reel...');
  const br = await createReelAPI({ video_url: u, caption: c, audio_title: a });
  if (br) {
    state.reels.unshift({ id: br.id, author: state.currentUser.username, avatar: state.currentUser.avatar, caption: c, video: u, audio: a, likes: 0, comments: [] });
    renderReels(); resetUploadState('reel'); closeAllModals();
    document.getElementById('reel-caption-input').value = ''; document.getElementById('reel-audio-input').value = '';
    showToast('Reel sačuvan u bazi!'); switchTab('reels');
  } else {
    showToast('Niste prijavljeni ili je došlo do greške.');
  }
}

function resetUploadState(t){state.uploadedMedia[t]=null;const d=document.getElementById(`${t}-dropzone`),p=document.getElementById(`${t}-preview-box`),f=document.getElementById(`${t}-file-input`);if(d)d.classList.remove('hidden');if(p)p.classList.add('hidden');if(f)f.value='';}
function openModal(m){if(m)m.classList.remove('hidden');}
function closeAllModals(){document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));}
