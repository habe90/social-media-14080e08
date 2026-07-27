// SELAMY - DNEVNI IZAZOV DOBRIH DJELA

import { state } from '../state.js';
import { showToast } from '../utils/compressor.js';
import { fetchDailyChallengesAPI, toggleDailyChallengeAPI } from '../services/api.js';

export async function initChallengesModule() {
  await loadDailyChallenges();
}

export async function loadDailyChallenges() {
  const data = await fetchDailyChallengesAPI();
  if (data && Array.isArray(data.challenges)) {
    state.dailyChallenges = data.challenges;
    if (data.stats) state.challengeStats = data.stats;
  }
  renderChallengesWidget();
}

export function renderChallengesWidget() {
  const container = document.getElementById('daily-challenges-widget');
  if (!container) return;

  const completedCount = state.dailyChallenges.filter(c => c.completed).length;
  const totalCount = state.dailyChallenges.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const { totalCompletedAllTime = 0, streakDays = 0 } = state.challengeStats || {};

  if (totalCount === 0) {
    container.innerHTML = '';
    return;
  }

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

      <div class="challenges-stats-row">
        <span><i class="fa-solid fa-fire"></i> Niz: ${streakDays} ${streakDays === 1 ? 'dan' : 'dana'}</span>
        <span><i class="fa-solid fa-trophy"></i> Ukupno završeno: ${totalCompletedAllTime}</span>
      </div>

      <div class="challenges-list">
        ${state.dailyChallenges.map((ch) => `
          <div class="challenge-item ${ch.completed ? 'completed' : ''}" data-ch-id="${ch.id}">
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
    item.onclick = async () => {
      if (!state.currentUser.loggedIn) {
        showToast('Molimo prijavite se da biste pratili izazove.');
        document.getElementById('login-overlay')?.classList.remove('hidden');
        return;
      }
      const id = parseInt(item.getAttribute('data-ch-id'), 10);
      const ch = state.dailyChallenges.find(c => c.id === id);
      if (!ch) return;

      const result = await toggleDailyChallengeAPI(id);
      if (!result) { showToast('Greška pri ažuriranju izazova.'); return; }

      ch.completed = result.completed;
      if (result.stats) state.challengeStats = result.stats;
      renderChallengesWidget();
      showToast(ch.completed ? 'Čestitamo! Aktivnost je završena ✨' : 'Aktivnost poništena');
    };
  });
}
