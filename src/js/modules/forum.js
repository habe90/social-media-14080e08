// SELAMY - FORUM I ZAJEDNICA (POSTGRESQL SYNC)

import { state } from '../state.js';
import { showToast } from '../utils/compressor.js';
import { playSound } from '../utils/sound.js';
import { fetchForumAPI, createForumTopicAPI } from '../services/api.js';

export async function initForumModule() {
  await loadForumTopicsFromBackend();
  renderForumTopics();
  setupForumEvents();
}

export async function loadForumTopicsFromBackend() {
  const backendTopics = await fetchForumAPI();
  if (backendTopics && Array.isArray(backendTopics)) {
    state.forumTopics = backendTopics.map(t => {
      let label = '💡 Savjeti i nasihat';
      if (t.category === 'znanje') label = '📚 Znanje i edukacija';
      if (t.category === 'humanitarno') label = '🤝 Humanitarno';
      if (t.category === 'opste') label = '💬 Opšte korisno';

      return {
        id: t.id,
        title: t.title,
        author: t.author || 'halil_official',
        authorAvatar: t.authoravatar || t.authorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
        category: t.category,
        categoryLabel: label,
        timeAgo: t.created_at ? new Date(t.created_at).toLocaleDateString('bs-BA') : 'Upravo',
        upvotes: t.likes_count || 1,
        upvoted: false,
        repliesCount: t.replies_count || 0,
        content: t.content,
        replies: []
      };
    });
  }
}

export function renderForumTopics(filterCategory = 'all') {
  const container = document.getElementById('forum-topics-container');
  if (!container) return;

  container.innerHTML = '';

  const topics = filterCategory === 'all' 
    ? state.forumTopics 
    : state.forumTopics.filter(t => t.category === filterCategory);

  if (!topics || topics.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color);">
        <i class="fa-solid fa-comments" style="font-size: 36px; color: var(--primary-blue); margin-bottom: 12px;"></i>
        <p>Nema otvorenih tema u ovoj kategoriji. Baza je prazna.</p>
        <p style="font-size: 13px; margin-top: 4px;">Budite prvi koji će pokrenuti korisnu diskusiju ili postaviti pitanje!</p>
      </div>
    `;
    return;
  }

  topics.forEach(topic => {
    const card = document.createElement('div');
    card.className = 'forum-topic-card';

    card.innerHTML = `
      <div class="forum-topic-header">
        <div class="forum-author">
          <img src="${topic.authorAvatar}" alt="${topic.author}">
          <div class="forum-author-meta">
            <strong>${topic.author}</strong>
            <span class="forum-time">${topic.timeAgo}</span>
          </div>
        </div>
        <span class="forum-cat-badge">${topic.categoryLabel}</span>
      </div>

      <h3 class="forum-topic-title">${topic.title}</h3>
      <p class="forum-topic-body">${topic.content}</p>

      <div class="forum-topic-actions">
        <button class="forum-action-btn btn-upvote ${topic.upvoted ? 'upvoted' : ''}">
          <i class="fa-solid fa-thumbs-up"></i>
          <span>${topic.upvotes} glasova podrške</span>
        </button>
        <button class="forum-action-btn btn-toggle-replies">
          <i class="fa-regular fa-comment"></i>
          <span>${topic.replies ? topic.replies.length : 0} odgovora</span>
        </button>
      </div>

      <div class="forum-replies-box hidden">
        <div class="replies-list">
          ${topic.replies ? topic.replies.map(r => `
            <div class="forum-reply-item">
              <strong>${r.user}</strong>: <span>${r.text}</span>
              <span class="reply-time">${r.time}</span>
            </div>
          `).join('') : ''}
        </div>
        <div class="add-reply-row">
          <input type="text" placeholder="Napišite odgovor ili savjet..." class="input-reply">
          <button class="btn-primary btn-submit-reply" style="padding: 6px 14px; font-size: 13px;">Odgovori</button>
        </div>
      </div>
    `;

    const btnUpvote = card.querySelector('.btn-upvote');
    if (btnUpvote) {
      btnUpvote.onclick = () => {
        topic.upvoted = !topic.upvoted;
        topic.upvotes += topic.upvoted ? 1 : -1;
        playSound(topic.upvoted ? 'like' : 'click');
        renderForumTopics(filterCategory);
      };
    }

    const btnReplies = card.querySelector('.btn-toggle-replies');
    const repliesBox = card.querySelector('.forum-replies-box');
    if (btnReplies && repliesBox) {
      btnReplies.onclick = () => {
        playSound('click');
        repliesBox.classList.toggle('hidden');
      };
    }

    const btnSubmitReply = card.querySelector('.btn-submit-reply');
    const inputReply = card.querySelector('.input-reply');

    const postReply = () => {
      const text = inputReply.value.trim();
      if (!text) return;

      playSound('comment');
      if (!topic.replies) topic.replies = [];
      topic.replies.push({
        id: 'fr-' + Date.now(),
        user: state.currentUser.username,
        text: text,
        time: 'Upravo'
      });

      inputReply.value = '';
      renderForumTopics(filterCategory);
      showToast('Vaš odgovor je uspješno objavljen!');
    };

    if (btnSubmitReply && inputReply) {
      btnSubmitReply.onclick = postReply;
      inputReply.onkeypress = (e) => {
        if (e.key === 'Enter') postReply();
      };
    }

    container.appendChild(card);
  });
}

function setupForumEvents() {
  document.querySelectorAll('.forum-chip').forEach(chip => {
    chip.onclick = () => {
      playSound('click');
      document.querySelectorAll('.forum-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.getAttribute('data-forum-cat');
      renderForumTopics(cat);
    };
  });

  const btnNewTopic = document.getElementById('btn-open-new-topic');
  if (btnNewTopic) {
    btnNewTopic.onclick = () => {
      playSound('click');
      const modal = document.getElementById('new-topic-modal');
      if (modal) modal.classList.remove('hidden');
    };
  }

  const btnSubmitTopic = document.getElementById('btn-submit-new-topic');
  if (btnSubmitTopic) {
    btnSubmitTopic.onclick = async () => {
      const title = document.getElementById('topic-title-input')?.value.trim();
      const cat = document.getElementById('topic-category-select')?.value || 'nasihat';
      const content = document.getElementById('topic-content-input')?.value.trim();

      if (!title || !content) {
        showToast('Unesite naslov i sadržaj teme.');
        return;
      }

      playSound('post');
      showToast('Pokrećem novu teme u PostgreSQL bazi...');

      const created = await createForumTopicAPI({ category: cat, title, content });

      let label = '💡 Savjeti i nasihat';
      if (cat === 'znanje') label = '📚 Znanje i edukacija';
      if (cat === 'humanitarno') label = '🤝 Humanitarno';
      if (cat === 'opste') label = '💬 Opšte korisno';

      const newTopic = {
        id: created ? created.id : ('ft-' + Date.now()),
        title: title,
        author: state.currentUser.username,
        authorAvatar: state.currentUser.avatar,
        category: cat,
        categoryLabel: label,
        timeAgo: 'Upravo sada',
        upvotes: 1,
        upvoted: true,
        repliesCount: 0,
        content: content,
        replies: []
      };

      state.forumTopics.unshift(newTopic);
      renderForumTopics('all');

      document.getElementById('topic-title-input').value = '';
      document.getElementById('topic-content-input').value = '';

      document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
      showToast('Nova tema je sačuvana u PostgreSQL bazi!');
    };
  }
}
