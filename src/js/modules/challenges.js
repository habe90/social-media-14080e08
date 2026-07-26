// SELAMY - DNEVNI IZAZOV DOBRIH DJELA

import { state } from '../state.js';
import { showToast } from '../utils/compressor.js';

export function initChallengesModule() {
  renderChallengesWidget();
}

export function renderChallengesWidget() {
  const container = document.getElementById('daily-challenges-widget');
  if (!container) return;

  const completedCount = state.dailyChallenges.filter(c => c.completed).length;
  const totalCount = state.dailyChallenges.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  container.innerHTML = `
    <div class="challenges-card">
      <div class="challenges-header">
        <div class="challenges-title-group">
          <i class="fa-solid fa-heart-pulse challenges-icon"></i>
          <div>
            <h4 class="challenges-title">Dnevni izazov dobrih djela</h4>
            <span class="challenges-sub">Završi današnje korisne aktivnosti (${completedCount}/${totalCount})</span>
          </div>
        </div>
        <div class="challenges-progress-circle">
          <span>${percent}%</span>
        </div>
      </div>

      <div class="challenges-list">
        ${state.dailyChallenges.map((ch, idx) => `
          <div class="challenge-item ${ch.completed ? 'completed' : ''}" data-ch-index="${idx}">
            <div class="ch-check-box">
              <i class="fa-solid fa-check"></i>
            </div>
            <span class="ch-title">${ch.title}</span>
            <span class="ch-cat-badge">${ch.category}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.challenge-item').forEach(item => {
    item.onclick = () => {
      const idx = parseInt(item.getAttribute('data-ch-index'), 10);
      if (!isNaN(idx) && state.dailyChallenges[idx]) {
        state.dailyChallenges[idx].completed = !state.dailyChallenges[idx].completed;
        renderChallengesWidget();
        showToast(state.dailyChallenges[idx].completed ? 'Čestitamo! Aktivnost je završena ✨' : 'Aktivnost poništena');
      }
    };
  });
}
