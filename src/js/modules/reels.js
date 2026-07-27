// SELAMY - REELS VIDEO ZAPISI (POSTGRESQL SYNC + AUTOPLAY ON SCROLL)

import { state } from '../state.js';
import { showToast } from '../utils/compressor.js';
import { playSound } from '../utils/sound.js';
import { fetchReelsAPI, likeReelAPI, commentReelAPI, fetchReelCommentsAPI } from '../services/api.js';

let reelsObserver = null;

export async function initReelsModule() {
  await loadReelsFromBackend();
  renderReels();
}

export async function loadReelsFromBackend() {
  const backendReels = await fetchReelsAPI();
  if (backendReels?.length) {
    state.reels = backendReels.map(r => ({
      id: r.id,
      author: r.author || 'halil_official',
      avatar: r.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      caption: r.caption || '',
      video: r.video_url || r.video,
      audio: r.audio_title || r.audio || 'Selamy Original Audio',
      likes: r.likes_count || 0,
      comments: r.comments || []
    }));
  }
}

export function playCurrentVisibleReel() {
  const container = document.getElementById('reels-container');
  if (!container) return;
  const cards = Array.from(container.querySelectorAll('.reel-card'));
  if (!cards.length) return;

  const containerRect = container.getBoundingClientRect();
  let foundTarget = false;

  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const videoEl = card.querySelector('video.reel-video');
    if (!videoEl) return;

    const visibleHeight = Math.max(0, Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top));
    const isMainlyVisible = visibleHeight >= rect.height * 0.5;

    if (isMainlyVisible && !foundTarget) {
      foundTarget = true;
      videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  });
}

export function renderReels() {
  const container = document.getElementById('reels-container');
  if (!container) return;
  container.innerHTML = '';

  if (reelsObserver) {
    reelsObserver.disconnect();
    reelsObserver = null;
  }

  if (!state.reels?.length) {
    container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:40px;"><p>Nema objavljenih videa.</p><p>Objavite prvi Reel!</p></div>`;
    return;
  }

  state.reels.forEach((reel) => {
    const isLiked = state.likedReels.has(reel.id);
    const card = document.createElement('div');
    card.className = 'reel-card';
    card.dataset.reelId = reel.id;

    const vUrl = reel.video || '';
    const isVideo = vUrl && (
      vUrl.startsWith('data:video') || 
      vUrl.startsWith('blob:') || 
      vUrl.startsWith('/uploads/') ||
      /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(vUrl) ||
      vUrl.includes('mixkit')
    );
    const safeComments = Array.isArray(reel.comments) ? reel.comments : [];

    card.innerHTML = `
      ${isVideo ? `<video class="reel-video" loop muted playsinline preload="metadata"><source src="${vUrl}" type="video/mp4"></video>` : `<img class="reel-video" src="${vUrl}" style="object-fit:cover;width:100%;height:100%;">`}
      <div class="reel-overlay-content">
        <div class="reel-user-row">
          <img src="${reel.avatar}">
          <span class="reel-author">${reel.author}</span>
          <button class="btn-follow-sm">Zaprati</button>
        </div>
        <p class="reel-caption">${reel.caption}</p>
        <div class="reel-audio-track"><i class="fa-solid fa-music"></i> ${reel.audio}</div>
      </div>
      <div class="reel-side-actions">
        <button class="icon-btn btn-reel-like ${isLiked ? 'liked' : ''}" data-action="like">
          <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
          <span class="action-num">${isLiked ? reel.likes + 1 : reel.likes}</span>
        </button>
        <button class="icon-btn" data-action="comments">
          <i class="fa-regular fa-comment"></i>
          <span class="action-num">${safeComments.length}</span>
        </button>
        <button class="icon-btn" data-action="share">
          <i class="fa-regular fa-paper-plane"></i>
        </button>
        ${isVideo ? `<button class="icon-btn" data-action="mute" title="Uključi/isključi zvuk"><i class="fa-solid fa-volume-xmark"></i></button>` : ''}
      </div>
    `;

    const toggleLike = () => {
      if (state.likedReels.has(reel.id)) {
        state.likedReels.delete(reel.id);
        if (reel.likes > 0) reel.likes--;
      } else {
        state.likedReels.add(reel.id);
        reel.likes++;
      }
      likeReelAPI(reel.id);
      playSound(state.likedReels.has(reel.id) ? 'like' : 'click');
      renderReels();
    };

    const videoEl = card.querySelector('video.reel-video');
    if (videoEl) {
      videoEl.onclick = () => {
        playSound('click');
        if (videoEl.paused) {
          videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      };
    }

    card.querySelectorAll('[data-action="like"]').forEach(b => b.onclick = toggleLike);
    card.querySelectorAll('[data-action="mute"]').forEach(b => b.onclick = () => {
      playSound('click');
      if (videoEl) {
        videoEl.muted = !videoEl.muted;
        b.innerHTML = videoEl.muted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
      }
    });
    card.querySelectorAll('[data-action="comments"]').forEach(b => b.onclick = async () => {
      playSound('click');
      state.activeReelCommentId = reel.id;
      const bc = await fetchReelCommentsAPI(reel.id);
      if (bc) reel.comments = bc;
      renderReelCommentsList(reel);
      document.getElementById('reel-comments-modal')?.classList.remove('hidden');
    });
    card.querySelectorAll('[data-action="share"]').forEach(b => b.onclick = () => {
      playSound('click');
      navigator.clipboard?.writeText(location.href);
      showToast('Link kopiran!');
    });

    container.appendChild(card);
  });

  // IntersectionObserver za prebacivanje i autoplay pri skrolovanju
  reelsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const videoEl = entry.target.querySelector('video.reel-video');
      if (!videoEl) return;

      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        container.querySelectorAll('video.reel-video').forEach(v => {
          if (v !== videoEl) v.pause();
        });
        videoEl.play().catch(err => {
          console.log('Autoplay prevented by browser:', err);
        });
      } else {
        videoEl.pause();
      }
    });
  }, {
    root: container,
    threshold: 0.5
  });

  container.querySelectorAll('.reel-card').forEach(card => {
    reelsObserver.observe(card);
  });

  container.onscroll = () => {
    clearTimeout(container._scrollTimeout);
    container._scrollTimeout = setTimeout(() => {
      playCurrentVisibleReel();
    }, 150);
  };

  // Reel comment submit
  const sb = document.getElementById('btn-send-reel-comment');
  const si = document.getElementById('reel-comment-input');
  if (sb && si) sb.onclick = async () => {
    const t = si.value.trim();
    if (!t || !state.activeReelCommentId) return;
    playSound('comment');
    const r = await commentReelAPI(state.activeReelCommentId, t);
    if (r?.comment) {
      const reel = state.reels.find(x => x.id == state.activeReelCommentId);
      if (reel) {
        if (!reel.comments) reel.comments = [];
        reel.comments.push(r.comment);
      }
    }
    si.value = '';
    const reel = state.reels.find(x => x.id == state.activeReelCommentId);
    if (reel) renderReelCommentsList(reel);
    renderReels();
    showToast('Komentar sačuvan u bazi!');
  };
}

export function renderReelCommentsList(reel) {
  const list = document.getElementById('reel-comments-list');
  if (!list) return;
  list.innerHTML = (!reel.comments?.length)
    ? '<p style="color:var(--text-muted);text-align:center;font-size:13px;">Nema komentara.</p>'
    : reel.comments.map(c => `<div style="display:flex;gap:10px;margin-bottom:12px;font-size:13px;"><strong>${c.user}</strong> ${c.text}</div>`).join('');
}
