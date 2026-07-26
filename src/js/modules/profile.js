// SELAMY - PROFILE MODULE

import { state } from '../state.js';

export function initProfileModule() {
  renderProfileGrid();
}

export function renderProfileGrid() {
  const container = document.getElementById('profile-grid');
  if (!container) return;

  container.innerHTML = '';

  const userPosts = state.posts.filter(p => p.author === state.currentUser.username);
  const countNum = document.getElementById('posts-count-num');
  if (countNum) countNum.textContent = userPosts.length + 10;

  userPosts.forEach(post => {
    const item = document.createElement('div');
    item.className = 'explore-item';
    item.innerHTML = `
      <img src="${post.image}" alt="Profile Post">
      <div class="explore-overlay">
        <span><i class="fa-solid fa-heart"></i> ${post.likes}</span>
        <span><i class="fa-solid fa-comment"></i> ${post.comments.length}</span>
      </div>
    `;
    container.appendChild(item);
  });
}
