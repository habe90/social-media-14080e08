// SELAMY - REELS VIDEO ZAPISI (POSTGRESQL SYNC)

import { state } from '../state.js';
import { showToast } from '../utils/compressor.js';
import { playSound } from '../utils/sound.js';
import { fetchReelsAPI, likeReelAPI } from '../services/api.js';

export async function initReelsModule() {
  await loadReelsFromBackend();
  renderReels();
}

export async function loadReelsFromBackend() {
  const backendReels = await fetchReelsAPI();
  if (backendReels && backendReels.length > 0) {
    state.reels = backendReels.map(r => ({
      id: r.id,
      author: r.author || 'halil_official',
      avatar: r.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      caption: r.caption || '',
      video: r.video_url || r.video,
      audio: r.audio_title || r.audio || 'Selamy Original Audio',
      likes: r.likes_count || r.likes || 0,
      liked: false,
      comments: r.comments || []
    }));
  }
}

export function renderReels() {
  const container = document.getElementById('reels-container');
  if (!container) return;

  container.innerHTML = '';

  if (!state.reels || state.reels.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px;">
        <p>Trenutno nema objavljenih video zapisa.</p>
        <p>Budite prvi koji će objaviti Reel sa vašeg uređaja!</p>
      </div>
    `;
    return;
  }

  state.reels.forEach((reel) => {
    const card = document.createElement('div');
    card.className = 'reel-card';

    const isVideo = reel.video && (reel.video.startsWith('data:video') || reel.video.endsWith('.mp4') || reel.video.includes('mixkit') || reel.video.startsWith('blob:'));

    card.innerHTML = `
      ${isVideo ? `
        <video class="reel-video" loop muted playsinline poster="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80">
          <source src="${reel.video}" type="video/mp4">
          Vaš preglednik ne podržava reprodukciju videa.
        </video>
      ` : `
        <img class="reel-video" src="${reel.video}" alt="Reel Slika" style="object-fit: cover; width: 100%; height: 100%;">
      `}

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
          <span class="action-num">${reel.comments ? reel.comments.length : 0}</span>
        </button>
        <button class="icon-btn btn-reel-share">
          <i class="fa-regular fa-paper-plane"></i>
        </button>
        ${isVideo ? `
          <button class="icon-btn btn-reel-mute">
            <i class="fa-solid fa-volume-xmark"></i>
          </button>
        ` : ''}
      </div>
    `;

    const videoEl = card.querySelector('video.reel-video');
    const btnMute = card.querySelector('.btn-reel-mute');
    const btnLike = card.querySelector('.btn-reel-like');
    const btnComments = card.querySelector('.btn-reel-comments');
    const btnShare = card.querySelector('.btn-reel-share');

    if (videoEl) {
      videoEl.onclick = () => {
        playSound('click');
        if (videoEl.paused) videoEl.play().catch(() => {});
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
        likeReelAPI(reel.id);
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
