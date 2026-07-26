// SELAMY - STORIES MODULE (POSTGRESQL SYNC)

import { state } from '../state.js';
import { showToast } from '../utils/compressor.js';
import { playSound } from '../utils/sound.js';
import { fetchStoriesAPI, commentStoryAPI } from '../services/api.js';

export async function initStoriesModule() {
  await loadStoriesFromBackend();
  renderStories();
  setupStoryControls();
}

export async function loadStoriesFromBackend() {
  const backendStories = await fetchStoriesAPI();
  if (backendStories && Array.isArray(backendStories)) {
    const storyGroupMap = {};
    backendStories.forEach(s => {
      const uname = s.username || 'nepoznato';
      if (!storyGroupMap[uname]) {
        storyGroupMap[uname] = {
          id: 'story-' + uname,
          isMe: state.currentUser.loggedIn && uname === state.currentUser.username,
          username: (state.currentUser.loggedIn && uname === state.currentUser.username) ? 'Vaša priča' : uname,
          avatar: s.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
          hasUnseen: true,
          slides: []
        };
      }
      storyGroupMap[uname].slides.push({
        id: s.id,
        media: s.media_url || s.media,
        time: s.created_at ? new Date(s.created_at).toLocaleDateString('bs-BA') : 'Upravo',
        text: s.text || ''
      });
    });
    state.stories = Object.values(storyGroupMap);
  }
  let myStory = state.stories.find(s => s.isMe);
  if (!myStory && state.currentUser.loggedIn) {
    myStory = {
      id: 'my-story',
      isMe: true,
      username: 'Vaša priča',
      avatar: state.currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      hasUnseen: false,
      slides: []
    };
    state.stories.unshift(myStory);
  }
}

export function renderStories() {
  const storiesList = document.getElementById('stories-list');
  if (!storiesList) return;
  storiesList.innerHTML = '';
  state.stories.forEach((story, idx) => {
    const isMe = story.isMe;
    const storyEl = document.createElement('div'); storyEl.className = 'story-item';
    const ringClass = story.hasUnseen ? 'story-ring' : 'story-ring seen';
    if (isMe) {
      storyEl.innerHTML = `<div class="${ringClass}"><img src="${story.avatar}" alt="${story.username}"><div class="add-story-badge" title="Dodaj novu priču"><i class="fa-solid fa-plus"></i></div></div><span class="story-username">${story.username}</span>`;
      storyEl.onclick = () => { playSound('click'); story.slides?.length > 0 ? openStoryModal(idx) : (() => { const m = document.getElementById('create-modal'); if (m) m.classList.remove('hidden'); const ts = document.getElementById('tab-create-story'); if (ts) ts.click(); })(); };
    } else {
      storyEl.innerHTML = `<div class="${ringClass}"><img src="${story.avatar}" alt="${story.username}"></div><span class="story-username">${story.username}</span>`;
      storyEl.onclick = () => { playSound('click'); openStoryModal(idx); };
    }
    storiesList.appendChild(storyEl);
  });
}

export function openStoryModal(storyIdx) {
  const story = state.stories[storyIdx];
  if (!story?.slides?.length) { showToast('Korisnik nema aktivnih priča.'); return; }
  story.hasUnseen = false; renderStories();
  state.storyState.active = true; state.storyState.storyIndex = storyIdx; state.storyState.slideIndex = 0; state.storyState.progress = 0; state.storyState.isPaused = false;
  const m = document.getElementById('story-modal'); if (m) m.classList.remove('hidden');
  displayCurrentSlide();
}

function displayCurrentSlide() {
  const { storyIndex, slideIndex } = state.storyState;
  const story = state.stories[storyIndex]; if (!story) return closeStoryModal();
  const slide = story.slides[slideIndex];
  if (!slide) { storyIndex < state.stories.length - 1 ? openStoryModal(storyIndex + 1) : closeStoryModal(); return; }

  const av = document.getElementById('story-modal-avatar'); if (av) av.src = story.avatar;
  const un = document.getElementById('story-modal-username'); if (un) un.textContent = story.username;
  const tm = document.getElementById('story-modal-time'); if (tm) tm.textContent = slide.time || 'prije 1h';
  const pb = document.getElementById('story-progress-bar');
  if (pb) { pb.innerHTML = ''; story.slides.forEach((_, i) => { const seg = document.createElement('div'); seg.className = 'story-progress-segment'; const fill = document.createElement('div'); fill.className = 'story-progress-fill'; if (i < slideIndex) fill.style.width = '100%'; else if (i === slideIndex) fill.id = 'current-progress-fill'; seg.appendChild(fill); pb.appendChild(seg); }); }
  const sm = document.getElementById('story-media-container');
  if (sm) sm.innerHTML = `<img src="${slide.media}" alt="Story"><div class="story-text-overlay">${slide.text || ''}</div>`;
  startStoryTimer();
}

function startStoryTimer() { if (state.storyState.timer) clearInterval(state.storyState.timer); state.storyState.progress = 0; state.storyState.timer = setInterval(() => { if (state.storyState.isPaused) return; state.storyState.progress += 2; const fill = document.getElementById('current-progress-fill'); if (fill) fill.style.width = `${state.storyState.progress}%`; if (state.storyState.progress >= 100) { clearInterval(state.storyState.timer); nextStorySlide(); } }, 100); }
export function nextStorySlide() { playSound('pop'); state.storyState.slideIndex++; displayCurrentSlide(); }
export function prevStorySlide() { playSound('pop'); if (state.storyState.slideIndex > 0) { state.storyState.slideIndex--; displayCurrentSlide(); } else if (state.storyState.storyIndex > 0) { const prev = state.stories[state.storyState.storyIndex - 1]; if (prev?.slides?.length) { state.storyState.storyIndex--; state.storyState.slideIndex = prev.slides.length - 1; displayCurrentSlide(); } } }
export function closeStoryModal() { if (state.storyState.timer) clearInterval(state.storyState.timer); state.storyState.active = false; const m = document.getElementById('story-modal'); if (m) m.classList.add('hidden'); }

function setupStoryControls() {
  const btnClose = document.getElementById('btn-close-story'); if (btnClose) btnClose.onclick = closeStoryModal;
  const touchNext = document.getElementById('story-touch-next'); if (touchNext) touchNext.onclick = nextStorySlide;
  const touchPrev = document.getElementById('story-touch-prev'); if (touchPrev) touchPrev.onclick = prevStorySlide;
  const pauseBtn = document.getElementById('btn-pause-story');
  if (pauseBtn) pauseBtn.onclick = () => { playSound('click'); state.storyState.isPaused = !state.storyState.isPaused; pauseBtn.innerHTML = state.storyState.isPaused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>'; };

  const replySend = document.getElementById('story-reply-send');
  const replyInput = document.getElementById('story-reply-input');
  if (replySend && replyInput) {
    replySend.onclick = async () => {
      const txt = replyInput.value.trim(); if (!txt) return;
      playSound('message_send');
      const story = state.stories[state.storyState.storyIndex];
      const slide = story?.slides?.[state.storyState.slideIndex];
      if (slide?.id) await commentStoryAPI(slide.id, txt);
      replyInput.value = '';
      showToast('Odgovor na priču poslan i sačuvan u bazi!');
    };
  }
}
