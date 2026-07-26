// SELAMY - FEED OBJAVE I INSPIRACIJA DANA (POSTGRESQL SYNC)

import { state } from '../state.js';
import { showToast } from '../utils/compressor.js';
import { playSound } from '../utils/sound.js';
import { renderProfileGrid } from './profile.js';
import { fetchPostsAPI, likePostAPI, commentPostAPI, createStoryAPI } from '../services/api.js';

export async function initFeedModule() {
  renderInspirationWidget();
  await loadPostsFromBackend();
  renderPosts();
  renderSuggestions();
}

export async function loadPostsFromBackend() {
  const backendPosts = await fetchPostsAPI();
  if (backendPosts && Array.isArray(backendPosts)) {
    state.posts = backendPosts.map(p => ({
      id: p.id,
      author: p.author || 'halil_official',
      avatar: p.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      verified: true,
      location: p.location || 'Kalesija (Babajići)',
      image: p.image_url || p.image,
      caption: p.caption || '',
      likes: p.likes_count || 0,
      liked: false,
      saved: false,
      timeAgo: p.created_at ? new Date(p.created_at).toLocaleDateString('bs-BA') : 'Upravo',
      comments: (p.comments || []).map(c => ({ id: c.id, user: c.user, text: c.text }))
    }));
  }
}

export function renderInspirationWidget() {
  const container = document.getElementById('inspiration-widget-container');
  if (!container) return;
  const insp = state.dailyInspiration;

  container.innerHTML = `
    <div class="inspiration-card">
      <div class="insp-header">
        <span class="insp-badge"><i class="fa-solid fa-star"></i> ${insp.type}</span>
        <span class="insp-source">${insp.source}</span>
      </div>
      ${insp.arabic ? `<p class="insp-arabic">${insp.arabic}</p>` : ''}
      <p class="insp-text">${insp.text}</p>
      <div class="insp-actions">
        <button class="btn-insp-share" id="btn-share-insp-story"><i class="fa-solid fa-circle-plus"></i> Podijeli u priču</button>
      </div>
    </div>
  `;

  const btnShareInsp = container.querySelector('#btn-share-insp-story');
  if (btnShareInsp) {
    btnShareInsp.onclick = async () => {
      playSound('post');
      const text = `${insp.type}: ${insp.text}`;
      const media = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80';

      showToast('Spremam priču u PostgreSQL bazu...');
      const backendStory = await createStoryAPI({ media_url: media, text });

      let myStory = state.stories.find(s => s.isMe);
      if (!myStory) {
        myStory = { id: 'my-story', isMe: true, username: 'Vaša priča', avatar: state.currentUser.avatar, hasUnseen: true, slides: [] };
        state.stories.unshift(myStory);
      }

      myStory.slides.push({ id: backendStory ? backendStory.id : ('slide-' + Date.now()), media, time: 'Upravo', text });
      myStory.hasUnseen = true;
      showToast('Inspiracija dana sačuvana u bazi i podijeljena u priču! ✨');
    };
  }
}

export function renderPosts() {
  const container = document.getElementById('posts-container');
  if (!container) return;

  container.innerHTML = '';

  if (!state.posts || state.posts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 50px 20px; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color); margin-top: 20px;">
        <i class="fa-solid fa-images" style="font-size: 40px; margin-bottom: 15px; color: var(--primary-blue);"></i>
        <h3 style="color: var(--text-primary); margin-bottom: 8px;">Nema objavljenih objava</h3>
        <p style="font-size: 14px;">Baza je trenutno prazna. Budite prvi koji će podijeliti objavu sa vašeg uređaja!</p>
      </div>
    `;
    return;
  }

  state.posts.forEach((post) => {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.innerHTML = `
      <header class="post-header">
        <div class="post-author">
          <img src="${post.avatar}" class="post-avatar" alt="${post.author}">
          <div class="author-meta">
            <div class="author-name-row"><a href="#" class="author-name">${post.author}</a>${post.verified ? '<i class="fa-solid fa-circle-check verified-badge"></i>' : ''}</div>
            <span class="post-location"><i class="fa-solid fa-location-dot"></i> ${post.location}</span>
          </div>
        </div><button class="icon-btn btn-post-more"><i class="fa-solid fa-ellipsis"></i></button>
      </header>
      <div class="post-media-box" id="media-${post.id}"><img src="${post.image}" alt="Slika objave"><div class="like-heart-anim"><i class="fa-solid fa-heart"></i></div></div>
      <div class="post-actions">
        <div class="action-group">
          <button class="icon-btn btn-like ${post.liked ? 'liked' : ''}"><i class="${post.liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i></button>
          <button class="icon-btn btn-comment-focus"><i class="fa-regular fa-comment"></i></button>
          <button class="icon-btn btn-share"><i class="fa-regular fa-paper-plane"></i></button>
        </div>
        <button class="icon-btn btn-save ${post.saved ? 'saved' : ''}"><i class="${post.saved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'}"></i></button>
      </div>
      <div class="post-info">
        <span class="likes-count">${post.likes} sviđanja</span>
        <div class="post-caption"><strong>${post.author}</strong> ${post.caption}</div>
        <div class="post-comments-list">${(post.comments||[]).map(c => `<div class="comment-item" style="font-size:13px; margin-top:4px;"><strong>${c.user}</strong> ${c.text}</div>`).join('')}</div>
        <span class="post-time">${post.timeAgo}</span>
      </div>
      <div class="post-add-comment"><input type="text" placeholder="Dodaj komentar..." class="input-comment"><button class="btn-post-comment">Objavi</button></div>
    `;

    const mediaBox = card.querySelector('.post-media-box');
    const heartAnim = card.querySelector('.like-heart-anim');
    let lastTap = 0;

    if (mediaBox) {
      mediaBox.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastTap < 300 && now - lastTap > 0) {
          playSound('like');
          if (!post.liked) { post.liked = true; post.likes++; likePostAPI(post.id); renderPosts(); }
          if (heartAnim) { heartAnim.classList.add('pop'); setTimeout(() => heartAnim.classList.remove('pop'), 600); }
        }
        lastTap = now;
      });
    }

    const btnLike = card.querySelector('.btn-like');
    if (btnLike) btnLike.onclick = () => { post.liked = !post.liked; post.likes += post.liked ? 1 : -1; playSound(post.liked ? 'like' : 'click'); likePostAPI(post.id); renderPosts(); };

    const btnSave = card.querySelector('.btn-save');
    if (btnSave) btnSave.onclick = () => { post.saved = !post.saved; playSound('click'); renderPosts(); renderProfileGrid(); showToast(post.saved ? 'Objava je sačuvana' : 'Objava je uklonjena iz sačuvanih'); };

    const btnShare = card.querySelector('.btn-share');
    if (btnShare) btnShare.onclick = () => { playSound('click'); navigator.clipboard?.writeText(window.location.href); showToast('Link objave je kopiran!'); };

    const btnCommFocus = card.querySelector('.btn-comment-focus');
    const inputComment = card.querySelector('.input-comment');
    if (btnCommFocus && inputComment) btnCommFocus.onclick = () => { playSound('click'); inputComment.focus(); };

    const btnAddComment = card.querySelector('.btn-post-comment');
    const submitComment = async () => {
      const text = inputComment.value.trim();
      if (!text) return;
      playSound('comment');
      const result = await commentPostAPI(post.id, text);
      const newComment = result?.comment ? { id: result.comment.id, user: result.comment.user, text: result.comment.text } : { id: 'c-'+Date.now(), user: state.currentUser.username, text };
      post.comments.push(newComment);
      inputComment.value = '';
      renderPosts();
      showToast('Komentar je dodan i sačuvan u bazi!');
    };
    if (btnAddComment && inputComment) { btnAddComment.onclick = submitComment; inputComment.onkeypress = (e) => { if (e.key === 'Enter') submitComment(); }; }

    container.appendChild(card);
  });
}

export function renderSuggestions() {
  const container = document.getElementById('suggestions-list');
  if (!container) return;
  container.innerHTML = '';
  state.suggestions.forEach(s => {
    const item = document.createElement('div'); item.className = 'sugg-item';
    item.innerHTML = `<div class="sugg-user"><img src="${s.avatar}" alt="${s.username}"><div class="sugg-info"><span class="sugg-name">${s.username}</span><span class="sugg-sub">Popularno u vašoj blizini</span></div></div><button class="btn-text btn-follow-toggle">Zaprati</button>`;
    const btn = item.querySelector('.btn-follow-toggle');
    if (btn) btn.onclick = () => { playSound('click'); btn.textContent = btn.textContent === 'Zaprati' ? 'Pratiš' : 'Zaprati'; btn.style.color = btn.textContent === 'Pratiš' ? 'var(--text-muted)' : 'var(--primary-blue)'; };
    container.appendChild(item);
  });
}
