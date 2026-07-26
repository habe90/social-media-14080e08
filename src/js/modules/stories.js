// SELAMY - STORIES MODULE (CREATOR & INTERACTIVE VIEWER)

import { state } from '../state.js';
import { showToast } from '../utils/compressor.js';
import { playSound } from '../utils/sound.js';

export function initStoriesModule() {
  renderStories();
  setupStoryControls();
}

export function renderStories() {
  const storiesList = document.getElementById('stories-list');
  if (!storiesList) return;

  storiesList.innerHTML = '';

  state.stories.forEach((story, idx) => {
    const isMe = story.isMe;
    const storyEl = document.createElement('div');
    storyEl.className = 'story-item';

    const ringClass = story.hasUnseen ? 'story-ring' : 'story-ring seen';

    if (isMe) {
      storyEl.innerHTML = `
        <div class="${ringClass}">
          <img src="${story.avatar}" alt="${story.username}">
          <div class="add-story-badge" title="Dodaj novu priču"><i class="fa-solid fa-plus"></i></div>
        </div>
        <span class="story-username">${story.username}</span>
      `;
      storyEl.onclick = () => {
        playSound('click');
        if (story.slides.length > 0) {
          openStoryModal(idx);
        } else {
          const modal = document.getElementById('create-modal');
          if (modal) modal.classList.remove('hidden');
          const tabStory = document.getElementById('tab-create-story');
          if (tabStory) tabStory.click();
        }
      };
    } else {
      storyEl.innerHTML = `
        <div class="${ringClass}">
          <img src="${story.avatar}" alt="${story.username}">
        </div>
        <span class="story-username">${story.username}</span>
      `;
      storyEl.onclick = () => {
        playSound('click');
        openStoryModal(idx);
      };
    }

    storiesList.appendChild(storyEl);
  });
}

export function openStoryModal(storyIdx) {
  const story = state.stories[storyIdx];
  if (!story || !story.slides || story.slides.length === 0) {
    showToast('Korisnik nema aktivnih priča.');
    return;
  }

  story.hasUnseen = false;
  renderStories();

  state.storyState.active = true;
  state.storyState.storyIndex = storyIdx;
  state.storyState.slideIndex = 0;
  state.storyState.progress = 0;
  state.storyState.isPaused = false;

  const storyModal = document.getElementById('story-modal');
  if (storyModal) storyModal.classList.remove('hidden');

  displayCurrentSlide();
}

function displayCurrentSlide() {
  const { storyIndex, slideIndex } = state.storyState;
  const story = state.stories[storyIndex];
  if (!story) return closeStoryModal();

  const slide = story.slides[slideIndex];
  if (!slide) {
    if (storyIndex < state.stories.length - 1) {
      openStoryModal(storyIndex + 1);
    } else {
      closeStoryModal();
    }
    return;
  }

  const storyAvatar = document.getElementById('story-modal-avatar');
  const storyUsername = document.getElementById('story-modal-username');
  const storyTime = document.getElementById('story-modal-time');
  const storyProgressBar = document.getElementById('story-progress-bar');
  const storyMedia = document.getElementById('story-media-container');

  if (storyAvatar) storyAvatar.src = story.avatar;
  if (storyUsername) storyUsername.textContent = story.username;
  if (storyTime) storyTime.textContent = slide.time || 'prije 1h';

  if (storyProgressBar) {
    storyProgressBar.innerHTML = '';
    story.slides.forEach((_, i) => {
      const seg = document.createElement('div');
      seg.className = 'story-progress-segment';
      const fill = document.createElement('div');
      fill.className = 'story-progress-fill';
      if (i < slideIndex) fill.style.width = '100%';
      else if (i === slideIndex) fill.id = 'current-progress-fill';
      seg.appendChild(fill);
      storyProgressBar.appendChild(seg);
    });
  }

  if (storyMedia) {
    storyMedia.innerHTML = `
      <img src="${slide.media}" alt="Story Slide">
      ${slide.text ? `<div class="story-text-overlay">${slide.text}</div>` : ''}
    `;
  }

  startStoryTimer();
}

function startStoryTimer() {
  if (state.storyState.timer) clearInterval(state.storyState.timer);

  state.storyState.progress = 0;

  state.storyState.timer = setInterval(() => {
    if (state.storyState.isPaused) return;

    state.storyState.progress += 2;
    const fill = document.getElementById('current-progress-fill');
    if (fill) fill.style.width = `${state.storyState.progress}%`;

    if (state.storyState.progress >= 100) {
      clearInterval(state.storyState.timer);
      nextStorySlide();
    }
  }, 100);
}

export function nextStorySlide() {
  playSound('pop');
  state.storyState.slideIndex++;
  displayCurrentSlide();
}

export function prevStorySlide() {
  playSound('pop');
  if (state.storyState.slideIndex > 0) {
    state.storyState.slideIndex--;
    displayCurrentSlide();
  } else if (state.storyState.storyIndex > 0) {
    const prevStory = state.stories[state.storyState.storyIndex - 1];
    if (prevStory && prevStory.slides.length > 0) {
      state.storyState.storyIndex--;
      state.storyState.slideIndex = prevStory.slides.length - 1;
      displayCurrentSlide();
    }
  }
}

export function closeStoryModal() {
  if (state.storyState.timer) clearInterval(state.storyState.timer);
  state.storyState.active = false;
  const storyModal = document.getElementById('story-modal');
  if (storyModal) storyModal.classList.add('hidden');
}

function setupStoryControls() {
  const btnCloseStory = document.getElementById('btn-close-story');
  if (btnCloseStory) btnCloseStory.onclick = closeStoryModal;

  const touchNext = document.getElementById('story-touch-next');
  if (touchNext) touchNext.onclick = nextStorySlide;

  const touchPrev = document.getElementById('story-touch-prev');
  if (touchPrev) touchPrev.onclick = prevStorySlide;

  const pauseBtn = document.getElementById('btn-pause-story');
  if (pauseBtn) {
    pauseBtn.onclick = () => {
      playSound('click');
      state.storyState.isPaused = !state.storyState.isPaused;
      pauseBtn.innerHTML = state.storyState.isPaused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
    };
  }

  const replySendBtn = document.getElementById('story-reply-send');
  const replyInput = document.getElementById('story-reply-input');
  if (replySendBtn && replyInput) {
    replySendBtn.onclick = () => {
      const txt = replyInput.value.trim();
      if (!txt) return;
      playSound('message_send');
      replyInput.value = '';
      showToast('Odgovor na priču je poslan u porukama!');
    };
  }
}
