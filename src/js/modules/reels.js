// SELAMY - REELS VIDEO ZAPISI

import { state } from '../state.js';
import { showToast } from '../utils/compressor.js';
import { playSound } from '../utils/sound.js';

export function initReelsModule() {
  renderReels();
}

export function renderReels() {
  const container = document.getElementById('reels-container');
  if (!container) return;

  container.innerHTML = '';

  state.reels.forEach((reel) => {
    const card = document.createElement('div');
    card.className = 'reel-card';
    card.innerHTML = `
      <video class="reel-video" loop muted playsinline poster="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80">
        <source src="${reel.video}" type="video/mp4">
        Vaš preglednik ne podržava reprodukciju videa.
      </video>

      <div class="reel-overlay-content">
        <div class="reel-user-row">
          <img src="${reel.avatar}" alt="${reel.author}">
          <span class="reel-author">${reel.author}</span>
          <button class="btn-follow-sm btn-follow-reel">Zaprati</button>
        </div>
        <p class="reel-caption">${reel.caption}</p>
        <div class="reel-audio-track">
          <i class="fa-solid fa-music"></i> <span>${reel.audio}</span>
        </div>
      </div>

      <div class="reel-side-actions">
        <button class="icon-btn btn-reel-like ${reel.liked ? 'liked' : ''}">
          <i class="${reel.liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
          <span class="action-num">${reel.likes}</span>
        </button>
        <button class="icon-btn btn-reel-comments">
          <i class="fa-regular fa-comment"></i>
          <span class="action-num">${reel.comments.length}</span>
        </button>
        <button class="icon-btn btn-reel-share">
          <i class="fa-regular fa-paper-plane"></i>
        </button>
        <button class="icon-btn btn-reel-mute">
          <i class="fa-solid fa-volume-xmark"></i>
        </button>
      </div>
    `;

    const videoEl = card.querySelector('.reel-video');
    const btnMute = card.querySelector('.btn-reel-mute');
    const btnLike = card.querySelector('.btn-reel-like');
    const btnComments = card.querySelector('.btn-reel-comments');
    const btnShare = card.querySelector('.btn-reel-share');

    if (videoEl) {
      videoEl.onclick = () => {
        playSound('click');
        if (videoEl.paused) videoEl.play();
        else videoEl.pause();
      };
    }

    if (btnMute && videoEl) {
      btnMute.onclick = () => {
        playSound('click');
        videoEl.muted = !videoEl.muted;
        btnMute.innerHTML = videoEl.muted ? 
          '<i class="fa-solid fa-volume-xmark"></i>' : 
          '<i class="fa-solid fa-volume-high"></i>';
      };
    }

    if (btnLike) {
      btnLike.onclick = () => {
        reel.liked = !reel.liked;
        reel.likes += reel.liked ? 1 : -1;
        playSound(reel.liked ? 'like' : 'click');
        renderReels();
      };
    }

    if (btnComments) {
      btnComments.onclick = () => {
        playSound('click');
        state.activeReelCommentId = reel.id;
        renderReelCommentsList(reel);
        const modal = document.getElementById('reel-comments-modal');
        if (modal) modal.classList.remove('hidden');
      };
    }

    if (btnShare) {
      btnShare.onclick = () => {
        playSound('click');
        navigator.clipboard?.writeText(window.location.href);
        showToast('Link video zapisa je kopiran!');
      };
    }

    container.appendChild(card);
  });
}

export function renderReelCommentsList(reel) {
  const commentsList = document.getElementById('reel-comments-list');
  if (!commentsList) return;

  if (!reel.comments || reel.comments.length === 0) {
    commentsList.innerHTML = '<p style="color: var(--text-muted); text-align: center; font-size: 13px;">Nema komentara. Budite prvi koji će komentarisati!</p>';
    return;
  }

  commentsList.innerHTML = reel.comments.map(c => `
    <div style="display: flex; gap: 10px; margin-bottom: 12px; font-size: 13px;">
      <strong>${c.user}</strong>
      <span>${c.text}</span>
    </div>
  `).join('');
}
