// SELAMY - NOTIFICATIONS MODULE (POSTGRESQL SYNC)

import { fetchNotificationsAPI, markNotificationsReadAPI } from '../services/api.js';
import { openPostDetailModal } from './explore.js';
import { playSound } from '../utils/sound.js';

export async function initNotificationsModule() {
  await loadAndRenderNotifications();
}

export async function loadAndRenderNotifications() {
  const container = document.querySelector('#tab-notifications .notifications-container');
  if (!container) return;

  const data = await fetchNotificationsAPI();
  if (!data) {
    container.innerHTML = `
      <h2>Obavještenja</h2>
      <div style="text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <i class="fa-solid fa-lock" style="font-size: 32px; color: var(--primary-blue); margin-bottom: 10px;"></i>
        <p style="font-size: 14px;">Prijavite se da biste vidjeli vaša obavještenja.</p>
      </div>`;
    updateUnreadDots(0);
    return;
  }

  const { notifications = [], unread_count = 0 } = data;
  updateUnreadDots(unread_count);

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
      <h2>Obavještenja</h2>
      ${unread_count > 0 ? `<button class="btn-secondary" id="btn-mark-notifs-read" style="font-size: 12px; padding: 6px 12px;"><i class="fa-solid fa-check-double"></i> Označi sve pročitanim</button>` : ''}
    </div>
  `;

  if (notifications.length === 0) {
    container.innerHTML += `
      <div style="text-align: center; padding: 50px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <i class="fa-regular fa-bell-slash" style="font-size: 38px; color: var(--text-muted); margin-bottom: 12px;"></i>
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Nemate novih obavještenja</h3>
        <p style="font-size: 13px; color: var(--text-muted);">Kada neko lajkuje vašu objavu, napiše komentar ili odgovor, ovdje ćete dobiti obavještenje.</p>
      </div>`;
    return;
  }

  const section = document.createElement('div');
  section.className = 'notif-section';
  section.innerHTML = `<h4>Sva obavještenja (${notifications.length})</h4>`;

  const list = document.createElement('div');
  list.className = 'notif-list';

  notifications.forEach(n => {
    const item = document.createElement('div');
    item.className = `notif-item ${!n.is_read ? 'unread' : ''}`;
    if (!n.is_read) {
      item.style.borderColor = 'var(--primary-blue)';
      item.style.backgroundColor = 'rgba(0, 132, 255, 0.08)';
    }

    let messageText = '';
    let iconClass = 'fa-heart';
    let iconColor = 'var(--like-red)';

    if (n.type === 'post_like') {
      messageText = `je podržao/la vašu objavu.`;
      iconClass = 'fa-heart';
      iconColor = '#ef4444';
    } else if (n.type === 'post_comment') {
      messageText = `je komentarisao/la vašu objavu: "<em>${escapeHTML(n.text || '')}</em>"`;
      iconClass = 'fa-comment';
      iconColor = 'var(--accent-cyan)';
    } else if (n.type === 'reel_like') {
      messageText = `je lajkovao/la vaš video reel.`;
      iconClass = 'fa-clapperboard';
      iconColor = '#a855f7';
    } else if (n.type === 'reel_comment') {
      messageText = `je komentarisao/la vaš reel: "<em>${escapeHTML(n.text || '')}</em>"`;
      iconClass = 'fa-comment';
      iconColor = '#a855f7';
    } else if (n.type === 'story_reply') {
      messageText = `je odgovorio/la na vašu priču: "<em>${escapeHTML(n.text || '')}</em>"`;
      iconClass = 'fa-paper-plane';
      iconColor = 'var(--primary-blue)';
    } else {
      messageText = `je izvršio/la akciju.`;
    }

    const timeAgo = n.created_at ? new Date(n.created_at).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' }) : '';

    item.innerHTML = `
      <div class="notif-left">
        <img src="${n.actor_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80'}" alt="">
        <div>
          <span style="font-size: 13px;"><strong>@${escapeHTML(n.actor_nickname)}</strong> ${messageText}</span>
          <span style="display: block; font-size: 10px; color: var(--text-muted); margin-top: 2px;">
            <i class="fa-solid ${iconClass}" style="color: ${iconColor}; margin-right: 4px;"></i> ${timeAgo}
          </span>
        </div>
      </div>
      ${n.post_id ? `<button class="btn-secondary btn-view-notif-post" data-post-id="${n.post_id}" style="padding: 4px 12px; font-size: 12px;">Pogledaj</button>` : ''}
    `;

    const viewBtn = item.querySelector('.btn-view-notif-post');
    if (viewBtn) {
      viewBtn.onclick = () => {
        playSound('click');
        openPostDetailModal(n.post_id);
      };
    }

    list.appendChild(item);
  });

  section.appendChild(list);
  container.appendChild(section);

  const markBtn = document.getElementById('btn-mark-notifs-read');
  if (markBtn) {
    markBtn.onclick = async () => {
      playSound('click');
      await markNotificationsReadAPI();
      updateUnreadDots(0);
      await loadAndRenderNotifications();
    };
  }
}

function updateUnreadDots(count) {
  const dots = document.querySelectorAll('.nav-item[data-tab="notifications"] .dot, .mobile-actions [data-tab="notifications"] .dot');
  dots.forEach(dot => {
    if (count > 0) {
      dot.style.display = 'block';
    } else {
      dot.style.display = 'none';
    }
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
