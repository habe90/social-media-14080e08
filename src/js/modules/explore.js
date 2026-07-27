// SELAMY - ISTRAŽI / EXPLORE MODULE (POSTGRESQL SYNC)

import { fetchExploreAPI, fetchPostByIdAPI, likePostAPI, commentPostAPI } from '../services/api.js';
import { playSound } from '../utils/sound.js';
import { showToast } from '../utils/compressor.js';

let searchQuery = '';
let selectedTag = '';
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let currentPosts = [];
let searchDebounceTimer = null;

export async function initExploreModule() {
  setupExploreListeners();
  await loadExploreData();
}

export async function loadExploreData(append = false) {
  if (isLoading) return;
  isLoading = true;

  const gridEl = document.getElementById('explore-grid');
  if (gridEl && !append) {
    gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 28px; color: var(--primary-blue); margin-bottom: 10px;"></i>
        <p>Učitavam objave iz baze...</p>
      </div>`;
  }

  const res = await fetchExploreAPI({ q: searchQuery, tag: selectedTag, page: currentPage });
  isLoading = false;

  if (res && res.success) {
    totalPages = res.totalPages || 1;
    if (append) {
      currentPosts = [...currentPosts, ...(res.posts || [])];
    } else {
      currentPosts = res.posts || [];
    }

    renderSearchTags(res.tags || []);
    renderExploreGrid(currentPosts);
  } else {
    if (gridEl) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 32px; color: #ef4444; margin-bottom: 10px;"></i>
          <p>Greška pri učitavanju objava z baze.</p>
        </div>`;
    }
  }
}

function renderSearchTags(popularTags = []) {
  const container = document.getElementById('search-tags');
  if (!container) return;

  const defaultTags = ['fotografije', 'putovanja', 'kalesija', 'sarajevo', 'priroda', 'znanje'];
  const mergedTags = Array.from(new Set([...popularTags, ...defaultTags])).slice(0, 10);

  container.innerHTML = '';

  // "Sve" button
  const sveBtn = document.createElement('button');
  sveBtn.className = `tag-chip ${(!selectedTag || selectedTag === 'all' || selectedTag === 'sve') ? 'active' : ''}`;
  sveBtn.textContent = 'Sve';
  sveBtn.onclick = () => {
    playSound('click');
    selectedTag = '';
    currentPage = 1;
    loadExploreData();
  };
  container.appendChild(sveBtn);

  // Dynamic tag chips
  mergedTags.forEach(t => {
    const cleanTag = t.toLowerCase().replace(/^#/, '');
    const tagBtn = document.createElement('button');
    tagBtn.className = `tag-chip ${selectedTag.toLowerCase() === cleanTag ? 'active' : ''}`;
    tagBtn.textContent = `#${cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1)}`;
    tagBtn.onclick = () => {
      playSound('click');
      selectedTag = cleanTag;
      currentPage = 1;
      loadExploreData();
    };
    container.appendChild(tagBtn);
  });
}

function renderExploreGrid(posts = []) {
  const gridEl = document.getElementById('explore-grid');
  if (!gridEl) return;

  gridEl.innerHTML = '';

  if (!posts || posts.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color); margin-top: 10px;">
        <i class="fa-solid fa-magnifying-glass" style="font-size: 38px; color: var(--primary-blue); margin-bottom: 12px;"></i>
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Nema rezultata</h3>
        <p style="font-size: 13px; color: var(--text-muted);">Pokušajte sa drugim pojmom za pretragu ili izaberite drugu oznaku.</p>
      </div>`;
    return;
  }

  posts.forEach(post => {
    const item = document.createElement('div');
    item.className = 'explore-item';
    item.dataset.postId = post.id;
    item.innerHTML = `
      <img src="${post.image_url}" alt="${post.caption || 'Objava'}" loading="lazy">
      <div class="explore-overlay">
        <span><i class="fa-solid fa-heart"></i> ${post.likes_count || 0}</span>
        <span><i class="fa-solid fa-comment"></i> ${post.comments_count || 0}</span>
      </div>
    `;

    item.onclick = () => {
      playSound('click');
      openPostDetailModal(post.id);
    };

    gridEl.appendChild(item);
  });

  // Pagination / Load More button
  if (currentPage < totalPages) {
    const loadMoreContainer = document.createElement('div');
    loadMoreContainer.style.gridColumn = '1 / -1';
    loadMoreContainer.style.textAlign = 'center';
    loadMoreContainer.style.padding = '20px 0';

    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'btn-secondary';
    loadMoreBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Učitaj još objava';
    loadMoreBtn.onclick = () => {
      playSound('click');
      currentPage++;
      loadExploreData(true);
    };
    loadMoreContainer.appendChild(loadMoreBtn);
    gridEl.appendChild(loadMoreContainer);
  }
}

function setupExploreListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        loadExploreData();
      }, 300);
    };
  }
}

export async function openPostDetailModal(postId) {
  const modal = document.getElementById('post-detail-modal');
  if (!modal) return;

  const post = await fetchPostByIdAPI(postId);
  if (!post) {
    showToast('Objava nije pronađena');
    return;
  }

  document.getElementById('post-detail-img').src = post.image_url || post.image;
  document.getElementById('post-detail-username').textContent = `@${post.author}`;
  document.getElementById('post-detail-avatar').src = post.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80';
  document.getElementById('post-detail-location').textContent = post.location ? `📍 ${post.location}` : '';
  document.getElementById('post-detail-caption').innerHTML = `<strong>@${post.author}</strong> ${post.caption || ''}`;
  document.getElementById('post-detail-likes-count').textContent = post.likes_count || 0;
  
  const d = post.created_at ? new Date(post.created_at) : new Date();
  document.getElementById('post-detail-time').textContent = d.toLocaleDateString('bs-BA');

  const likeBtn = document.getElementById('post-detail-like-btn');
  if (likeBtn) {
    const heartIcon = likeBtn.querySelector('i');
    if (post.liked_by_me) {
      likeBtn.classList.add('liked');
      if (heartIcon) heartIcon.className = 'fa-solid fa-heart';
      likeBtn.style.color = '#ef4444';
    } else {
      likeBtn.classList.remove('liked');
      if (heartIcon) heartIcon.className = 'fa-regular fa-heart';
      likeBtn.style.color = 'var(--text-main)';
    }

    likeBtn.onclick = async () => {
      likeBtn.style.pointerEvents = 'none';
      const res = await likePostAPI(post.id);
      if (res && res.success) {
        post.liked_by_me = res.liked;
        post.likes_count = res.likes_count;
        document.getElementById('post-detail-likes-count').textContent = res.likes_count;
        if (res.liked) {
          if (heartIcon) heartIcon.className = 'fa-solid fa-heart';
          likeBtn.style.color = '#ef4444';
          playSound('like');
        } else {
          if (heartIcon) heartIcon.className = 'fa-regular fa-heart';
          likeBtn.style.color = 'var(--text-main)';
          playSound('click');
        }
      }
      likeBtn.style.pointerEvents = 'auto';
    };
  }

  // Comments
  renderPostDetailComments(post.comments || []);

  // Send comment
  const commentInput = document.getElementById('post-detail-comment-input');
  const sendCommentBtn = document.getElementById('btn-send-detail-comment');

  if (sendCommentBtn && commentInput) {
    sendCommentBtn.onclick = async () => {
      const text = commentInput.value.trim();
      if (!text) return;
      playSound('comment');
      const res = await commentPostAPI(post.id, text);
      if (res && res.comment) {
        post.comments = post.comments || [];
        post.comments.push(res.comment);
        renderPostDetailComments(post.comments);
        commentInput.value = '';
        showToast('Komentar sačuvan!');
      } else {
        showToast('Niste prijavljeni.');
      }
    };
  }

  modal.classList.remove('hidden');
}

function renderPostDetailComments(comments = []) {
  const container = document.getElementById('post-detail-comments-list');
  if (!container) return;
  container.innerHTML = '';

  if (!comments.length) {
    container.innerHTML = `<p style="font-size: 12px; color: var(--text-muted);">Još nema komentara. Budite prvi koji će komentarisati!</p>`;
    return;
  }

  comments.forEach(c => {
    const div = document.createElement('div');
    div.style.fontSize = '13px';
    div.style.lineHeight = '1.4';
    div.innerHTML = `<strong>@${c.user}</strong> ${c.text}`;
    container.appendChild(div);
  });
}
