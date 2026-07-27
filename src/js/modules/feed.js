// SELAMY - FEED OBJAVE I INSPIRACIJA DANA (POSTGRESQL SYNC)

import { state } from '../state.js';
import { showToast } from '../utils/compressor.js';
import { playSound } from '../utils/sound.js';
import { renderProfileGrid } from './profile.js';
import { fetchPostsAPI, likePostAPI, commentPostAPI, createStoryAPI, fetchAjetDanaAPI } from '../services/api.js';

export async function initFeedModule() {
  renderInspirationWidget();
  loadAjetDana();
  await loadPostsFromBackend();
  renderPosts();
  renderSuggestions();
}

export async function loadAjetDana() {
  const ajet = await fetchAjetDanaAPI();
  if (ajet && ajet.text) {
    state.dailyInspiration = { id: 'insp-' + ajet.source, type: ajet.type, source: ajet.source, text: ajet.text, arabic: ajet.arabic };
    renderInspirationWidget();
  }
}

export async function loadPostsFromBackend() {
  const backendPosts = await fetchPostsAPI();
  if (backendPosts && Array.isArray(backendPosts)) {
    state.posts = backendPosts.map(p => ({
      id: p.id,
      author: p.author || 'halil_official',
      avatar: p.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      verified: true,
      location: p.location || '',
      image: p.image_url || p.image,
      caption: p.caption || '',
      likes: parseInt(p.likes_count, 10) || 0,
      likedByMe: Boolean(p.liked_by_me),
      saved: false,
      timeAgo: p.created_at ? (()=>{const d=new Date(p.created_at);return d.toLocaleDateString('bs-BA')})() : 'Upravo',
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
      <div class="insp-header"><span class="insp-badge"><i class="fa-solid fa-star"></i> ${insp.type}</span><span class="insp-source">${insp.source}</span></div>
      ${insp.arabic ? `<p class="insp-arabic">${insp.arabic}</p>` : ''}
      <p class="insp-text">${insp.text}</p>
      <div class="insp-actions"><button class="btn-insp-share" id="btn-share-insp-story"><i class="fa-solid fa-circle-plus"></i> Podijeli u priču</button></div>
    </div>`;
  const btn = container.querySelector('#btn-share-insp-story');
  if (btn) btn.onclick = async () => {
    playSound('post');
    const text = `${insp.type}: ${insp.text}`;
    const media = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80';
    showToast('Spremam priču u bazu...');
    const s = await createStoryAPI({ media_url: media, text });
    let my = state.stories.find(x => x.isMe);
    if (!my) { my = { id: 'my-story', isMe: true, username: 'Vaša priča', avatar: state.currentUser.avatar, hasUnseen: true, slides: [] }; state.stories.unshift(my); }
    my.slides.push({ id: s?.id || ('slide-'+Date.now()), media, time: 'Upravo', text });
    my.hasUnseen = true;
    showToast('Inspiracija podijeljena i sačuvana u bazi! ✨');
  };
}

export function renderPosts() {
  const container = document.getElementById('posts-container');
  if (!container) return;
  container.innerHTML = '';

  if (!state.posts?.length) {
    container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:50px 20px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border-color);margin-top:20px;"><i class="fa-solid fa-images" style="font-size:40px;margin-bottom:15px;color:var(--primary-blue);"></i><h3>Nema objavljenih objava</h3><p style="font-size:14px;">Baza je prazna. Budite prvi koji će podijeliti objavu!</p></div>`;
    return;
  }

  state.posts.forEach((post) => {
    const isLiked = post.likedByMe;
    const displayLikes = post.likes;

    const card = document.createElement('article');
    card.className = 'post-card';
    card.dataset.postId = post.id;
    card.innerHTML = `
      <header class="post-header"><div class="post-author"><img src="${post.avatar}" class="post-avatar" alt=""><div class="author-meta"><div class="author-name-row"><span class="author-name">${post.author}</span>${post.verified?'<i class="fa-solid fa-circle-check verified-badge"></i>':''}</div>${post.location?`<span class="post-location"><i class="fa-solid fa-location-dot"></i> ${post.location}</span>`:''}</div></div><button class="icon-btn"><i class="fa-solid fa-ellipsis"></i></button></header>
      <div class="post-media-box"><img src="${post.image}" alt=""><div class="like-heart-anim"><i class="fa-solid fa-heart"></i></div></div>
      <div class="post-actions"><div class="action-group"><button class="icon-btn btn-like ${isLiked?'liked':''}" data-act="like"><i class="${isLiked?'fa-solid fa-heart':'fa-regular fa-heart'}"></i></button><button class="icon-btn" data-act="cmfocus"><i class="fa-regular fa-comment"></i></button><button class="icon-btn" data-act="share"><i class="fa-regular fa-paper-plane"></i></button></div><button class="icon-btn btn-save ${post.saved?'saved':''}" data-act="save"><i class="${post.saved?'fa-solid fa-bookmark':'fa-regular fa-bookmark'}"></i></button></div>
      <div class="post-info"><span class="likes-count"><strong>${displayLikes}</strong> sviđanja</span><div class="post-caption"><strong>${post.author}</strong> ${post.caption}</div><div class="post-comments-list">${(post.comments||[]).map(c=>`<div class="comment-item" style="font-size:13px;margin-top:4px;"><strong>${c.user}</strong> ${c.text}</div>`).join('')}</div><span class="post-time">${post.timeAgo}</span></div>
      <div class="post-add-comment"><input type="text" placeholder="Dodaj komentar..." class="input-comment"><button class="btn-post-comment" data-act="submitcm">Objavi</button></div>
    `;

    const mediaBox = card.querySelector('.post-media-box');
    const heartAnim = card.querySelector('.like-heart-anim');
    let lastTap = 0;
    let isLiking = false;

    const toggleLike = async () => {
      if (isLiking) return;
      isLiking = true;

      const likeBtn = card.querySelector('[data-act="like"]');
      if (likeBtn) likeBtn.style.pointerEvents = 'none';

      const res = await likePostAPI(post.id);
      if (res && res.success) {
        post.likedByMe = res.liked;
        post.likes = res.likes_count;
        if (res.liked) playSound('like');

        const heartIcon = card.querySelector('[data-act="like"] i');
        const likesCountEl = card.querySelector('.likes-count strong');
        const btnLike = card.querySelector('[data-act="like"]');

        if (btnLike) btnLike.classList.toggle('liked', post.likedByMe);
        if (heartIcon) heartIcon.className = post.likedByMe ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        if (likesCountEl) likesCountEl.textContent = post.likes;
      } else if (res && res.error) {
        showToast(res.error);
      }

      if (likeBtn) likeBtn.style.pointerEvents = 'auto';
      isLiking = false;
    };

    if (mediaBox) mediaBox.onclick = () => {
      const now = Date.now();
      if (now - lastTap < 300 && now - lastTap > 0) {
        if (!post.likedByMe) toggleLike();
        if (heartAnim) { heartAnim.classList.add('pop'); setTimeout(() => heartAnim.classList.remove('pop'), 600); }
      }
      lastTap = now;
    };

    card.querySelectorAll('[data-act="like"]').forEach(b => b.onclick = toggleLike);
    card.querySelectorAll('[data-act="save"]').forEach(b => b.onclick = () => { post.saved=!post.saved; renderPosts(); renderProfileGrid(); showToast(post.saved?'Sačuvano':'Uklonjeno'); });
    card.querySelectorAll('[data-act="share"]').forEach(b => b.onclick = () => { navigator.clipboard?.writeText(window.location.href); showToast('Link kopiran!'); });
    card.querySelectorAll('[data-act="cmfocus"]').forEach(b => b.onclick = () => { card.querySelector('.input-comment')?.focus(); });

    const input = card.querySelector('.input-comment');
    const submitBtn = card.querySelector('[data-act="submitcm"]');
    const doComment = async () => { const t = input.value.trim(); if(!t)return; playSound('comment'); const r = await commentPostAPI(post.id,t); post.comments.push(r?.comment||{id:'c-'+Date.now(),user:state.currentUser.username,text:t}); input.value=''; renderPosts(); showToast('Komentar sačuvan!'); };
    if (submitBtn&&input) { submitBtn.onclick = doComment; input.onkeypress = e => { if(e.key==='Enter') doComment(); }; }

    container.appendChild(card);
  });
}

export function renderSuggestions() {
  const c = document.getElementById('suggestions-list'); if (!c) return; c.innerHTML = '';
  state.suggestions.forEach(s => {
    const i = document.createElement('div'); i.className='sugg-item';
    i.innerHTML = `<div class="sugg-user"><img src="${s.avatar}"><div class="sugg-info"><span class="sugg-name">${s.username}</span><span class="sugg-sub">Popularno u blizini</span></div></div><button class="btn-text btn-follow-toggle">Zaprati</button>`;
    i.querySelector('.btn-follow-toggle').onclick = () => { const b=i.querySelector('.btn-follow-toggle'); b.textContent = b.textContent==='Zaprati'?'Pratiš':'Zaprati'; b.style.color = b.textContent==='Pratiš'?'var(--text-muted)':'var(--primary-blue)'; };
    c.appendChild(i);
  });
}
