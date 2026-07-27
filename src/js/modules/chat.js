// SELAMY - DIRECT MESSAGES (CHAT) MODULE WITH REAL POSTGRESQL BACKEND

import { state } from '../state.js';
import { playSound } from '../utils/sound.js';
import { compressImageFile, showToast } from '../utils/compressor.js';
import {
  fetchConversationsAPI,
  fetchMessagesAPI,
  sendMessageAPI,
  fetchUnreadMessagesCountAPI,
  searchUsersAPI
} from '../services/api.js';

let activePartnerId = null;
let activePartnerUser = null;
let chatPollingInterval = null;
let activeImageAttachment = null;

export async function initChatModule() {
  setupChatListeners();
  await loadConversations();
  updateUnreadCountBadge();

  // Expose global helper to start chat with any user from anywhere
  window.openChatWithUser = async (partnerId, partnerNickname) => {
    if (!state.currentUser.loggedIn) {
      showToast('Molimo prijavite se za slanje poruka.');
      document.getElementById('login-overlay')?.classList.remove('hidden');
      return;
    }
    
    // Switch to messages tab
    document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.getAttribute('data-tab') === 'messages'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === 'tab-messages'));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    await openChatWindow(partnerId || partnerNickname);
  };
}

function setupChatListeners() {
  // New chat button in chat header
  const btnNewChat = document.getElementById('btn-new-chat-trigger') || document.querySelector('.chats-header button');
  if (btnNewChat) {
    btnNewChat.onclick = (e) => {
      e.preventDefault();
      playSound('click');
      openNewChatModal();
    };
  }

  // "Pošalji poruku" on empty state button
  const btnStartChat = document.getElementById('btn-start-chat');
  if (btnStartChat) {
    btnStartChat.onclick = () => {
      playSound('click');
      openNewChatModal();
    };
  }

  // Polling for active chat and unread count every 3.5 seconds
  if (chatPollingInterval) clearInterval(chatPollingInterval);
  chatPollingInterval = setInterval(() => {
    const messagesTab = document.getElementById('tab-messages');
    if (messagesTab && messagesTab.classList.contains('active')) {
      if (activePartnerId) {
        refreshActiveChatMessages(true);
      }
      loadConversations(true);
    }
    updateUnreadCountBadge();
  }, 3500);
}

export async function updateUnreadCountBadge() {
  if (!state.currentUser.loggedIn) return;
  const count = await fetchUnreadMessagesCountAPI();
  
  const deskBadge = document.getElementById('unread-count');
  const mobBadge = document.getElementById('mobile-unread-count');

  [deskBadge, mobBadge].forEach(b => {
    if (b) {
      if (count > 0) {
        b.textContent = count > 99 ? '99+' : count;
        b.style.display = 'inline-flex';
      } else {
        b.style.display = 'none';
      }
    }
  });
}

export async function loadConversations(isBackground = false) {
  if (!state.currentUser.loggedIn) return;

  const data = await fetchConversationsAPI();
  const container = document.getElementById('chats-list');
  if (!container) return;

  if (!data || !data.conversations || data.conversations.length === 0) {
    if (!isBackground) {
      container.innerHTML = `
        <div style="padding: 24px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
          <i class="fa-regular fa-paper-plane" style="font-size: 28px; margin-bottom: 8px; opacity: 0.5;"></i>
          <p>Nematem još započetih razgovora.</p>
          <button class="btn-text" id="btn-start-first-chat" style="margin-top: 8px; font-weight: 600;"><i class="fa-solid fa-plus"></i> Započni novu poruku</button>
        </div>
      `;
      const btnFirst = document.getElementById('btn-start-first-chat');
      if (btnFirst) btnFirst.onclick = openNewChatModal;
    }
    return;
  }

  if (!isBackground) container.innerHTML = '';

  data.conversations.forEach(conv => {
    let item = container.querySelector(`[data-chat-id="${conv.partner_id}"]`);
    const isSelected = activePartnerId === conv.partner_id;

    const timeStr = formatChatTime(conv.last_message_time);
    const previewText = conv.last_message_media ? '📷 Slika' : (conv.last_message_text || 'Poruka');
    const isUnread = conv.unread_count > 0;

    const itemHTML = `
      <div class="chat-item-avatar-wrapper" style="position: relative;">
        <img src="${conv.partner_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}" alt="${conv.partner_nickname}">
        ${isUnread ? `<span class="unread-dot" style="position: absolute; top: 0; right: 0; width: 12px; height: 12px; background: var(--primary-blue); border-radius: 50%; border: 2px solid white;"></span>` : ''}
      </div>
      <div class="chat-meta" style="flex: 1; min-width: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span class="chat-name" style="font-weight: ${isUnread ? '700' : '600'}; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${conv.partner_nickname}</span>
          <span style="font-size: 10px; color: var(--text-muted);">${timeStr}</span>
        </div>
        <span class="chat-preview" style="font-size: 12px; color: ${isUnread ? 'var(--text-main)' : 'var(--text-muted)'}; font-weight: ${isUnread ? '600' : '400'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;">
          ${previewText}
        </span>
      </div>
    `;

    if (item) {
      item.className = `chat-item ${isSelected ? 'active' : ''}`;
      item.innerHTML = itemHTML;
    } else {
      item = document.createElement('div');
      item.className = `chat-item ${isSelected ? 'active' : ''}`;
      item.setAttribute('data-chat-id', conv.partner_id);
      item.innerHTML = itemHTML;
      container.appendChild(item);
    }

    item.onclick = () => {
      playSound('click');
      openChatWindow(conv.partner_id);
    };
  });
}

export async function openChatWindow(partnerId) {
  if (!partnerId) return;

  const emptyState = document.getElementById('empty-chat-state');
  const activeContent = document.getElementById('active-chat-content');

  // Show active container
  if (emptyState) emptyState.classList.add('hidden');
  if (activeContent) activeContent.classList.remove('hidden');

  // Mark in mobile view that active chat is open
  const chatsSidebar = document.querySelector('.chats-sidebar');
  if (chatsSidebar) chatsSidebar.classList.add('mobile-chat-active');

  // Fetch messages from backend
  const data = await fetchMessagesAPI(partnerId);
  if (!data || !data.partner) {
    showToast('Greška pri otvaranju razgovora.');
    return;
  }

  activePartnerId = data.partner.id;
  activePartnerUser = data.partner;

  // Highlight selected item in list
  document.querySelectorAll('.chat-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-chat-id') == activePartnerId);
  });

  renderChatThread(data.partner, data.messages);
  updateUnreadCountBadge();
}

export async function refreshActiveChatMessages(isBackground = false) {
  if (!activePartnerId) return;
  const data = await fetchMessagesAPI(activePartnerId);
  if (data && data.messages) {
    const msgArea = document.getElementById('msg-area');
    if (!msgArea) return;

    // Check if user is scrolled near bottom
    const isAtBottom = msgArea.scrollHeight - msgArea.scrollTop - msgArea.clientHeight < 120;
    
    // Only re-render if message count changed
    const currentMsgCount = msgArea.querySelectorAll('.msg-bubble-wrapper').length;
    if (data.messages.length !== currentMsgCount) {
      if (!isBackground) playSound('message_receive');
      renderChatThread(data.partner, data.messages, false);
      if (isAtBottom) msgArea.scrollTop = msgArea.scrollHeight;
    }
  }
}

function renderChatThread(partner, messages, autoScroll = true) {
  const activeContent = document.getElementById('active-chat-content');
  if (!activeContent) return;

  activeImageAttachment = null;

  activeContent.innerHTML = `
    <div class="chat-header-top" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-color); background: var(--card-bg);">
      <button class="icon-btn btn-back-chats" id="btn-back-chats" title="Nazad na razgovore" style="display: none;">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <img src="${partner.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" alt="${partner.nickname}">
      <div style="flex: 1; min-width: 0;">
        <strong style="font-size: 15px; font-weight: 700; display: block; overflow: hidden; text-overflow: ellipsis;">${partner.full_name || partner.nickname}</strong>
        <span style="font-size: 11px; color: var(--primary-blue);">@${partner.nickname}</span>
      </div>
      <button class="icon-btn" title="Informacije" onclick="alert('Korisnik: @${partner.nickname}')"><i class="fa-solid fa-circle-info"></i></button>
    </div>

    <div class="chat-messages-area" id="msg-area" style="flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;">
      ${messages.length === 0 ? `
        <div style="text-align: center; color: var(--text-muted); margin: auto; font-size: 13px;">
          <p>Nema prethodnih poruka sa korisnikom <strong>@${partner.nickname}</strong>.</p>
          <p style="font-size: 11px;">Napišite prvu poruku ispod! 👇</p>
        </div>
      ` : messages.map(m => {
        const isMine = m.sender_id === state.currentUser.id;
        const timeStr = formatChatTime(m.created_at);
        return `
          <div class="msg-bubble-wrapper ${isMine ? 'outgoing-wrap' : 'incoming-wrap'}" style="display: flex; flex-direction: column; align-items: ${isMine ? 'flex-end' : 'flex-start'}; margin-bottom: 4px;">
            <div class="msg-bubble ${isMine ? 'outgoing' : 'incoming'}">
              ${m.media_url ? `<img src="${m.media_url}" class="chat-msg-img" style="max-width: 240px; max-height: 240px; border-radius: 8px; margin-bottom: 6px; display: block; object-fit: cover;" onclick="window.open('${m.media_url}','_blank')">` : ''}
              ${m.text ? `<span>${escapeHTML(m.text)}</span>` : ''}
            </div>
            <span class="msg-time" style="font-size: 10px; color: var(--text-muted); margin-top: 2px; padding: 0 4px;">${timeStr}</span>
          </div>
        `;
      }).join('')}
    </div>

    <div id="chat-img-preview-bar" class="hidden" style="padding: 8px 16px; background: rgba(59, 130, 246, 0.08); border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px;">
      <img id="chat-img-preview-src" src="" style="width: 48px; height: 48px; border-radius: 6px; object-fit: cover;">
      <span style="font-size: 12px; color: var(--text-main); flex: 1;">Slika pripremIjena za slanje</span>
      <button class="icon-btn" id="btn-cancel-chat-img" style="color: #ef4444;"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <div class="chat-input-row" style="padding: 12px 16px; border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 8px; background: var(--card-bg);">
      <input type="file" id="chat-file-input" accept="image/*" class="hidden">
      <button class="icon-btn" id="btn-attach-chat-img" title="Priloži sliku" style="font-size: 18px; color: var(--primary-blue);"><i class="fa-regular fa-image"></i></button>
      <input type="text" id="dm-input" placeholder="Napišite privatnu poruku..." style="flex: 1; font-size: 16px !important;" autocomplete="off">
      <button class="btn-primary" id="btn-send-dm" style="padding: 10px 18px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-paper-plane"></i></button>
    </div>
  `;

  // Back button for mobile
  const btnBack = document.getElementById('btn-back-chats');
  if (btnBack) {
    btnBack.onclick = () => {
      playSound('click');
      const chatsSidebar = document.querySelector('.chats-sidebar');
      if (chatsSidebar) chatsSidebar.classList.remove('mobile-chat-active');
      if (activeContent) activeContent.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      activePartnerId = null;
    };
  }

  const msgArea = document.getElementById('msg-area');
  if (autoScroll && msgArea) msgArea.scrollTop = msgArea.scrollHeight;

  // File attach setup
  const chatFileInput = document.getElementById('chat-file-input');
  const btnAttach = document.getElementById('btn-attach-chat-img');
  const previewBar = document.getElementById('chat-img-preview-bar');
  const previewSrc = document.getElementById('chat-img-preview-src');
  const btnCancelImg = document.getElementById('btn-cancel-chat-img');

  if (btnAttach && chatFileInput) {
    btnAttach.onclick = () => { playSound('click'); chatFileInput.click(); };
    chatFileInput.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('Molimo izaberite sliku.');
        return;
      }
      try {
        showToast('⚡ Pripremam sliku...');
        const comp = await compressImageFile(file, 800, 0.75);
        activeImageAttachment = comp.dataUrl;
        if (previewSrc) previewSrc.src = comp.dataUrl;
        if (previewBar) previewBar.classList.remove('hidden');
        playSound('pop');
      } catch (err) {
        showToast('Greška pri učitavanju slike.');
      }
    };
  }

  if (btnCancelImg) {
    btnCancelImg.onclick = () => {
      activeImageAttachment = null;
      if (chatFileInput) chatFileInput.value = '';
      if (previewBar) previewBar.classList.add('hidden');
    };
  }

  // Send message function
  const dmInput = document.getElementById('dm-input');
  const sendBtn = document.getElementById('btn-send-dm');

  const handleSend = async () => {
    const text = dmInput ? dmInput.value.trim() : '';
    if (!text && !activeImageAttachment) return;

    playSound('message_send');

    const mediaUrl = activeImageAttachment;
    if (dmInput) dmInput.value = '';
    activeImageAttachment = null;
    if (chatFileInput) chatFileInput.value = '';
    if (previewBar) previewBar.classList.add('hidden');

    const res = await sendMessageAPI({
      receiver_id: partner.id,
      text: text,
      media_url: mediaUrl
    });

    if (res && res.success) {
      await refreshActiveChatMessages(false);
      await loadConversations(true);
    } else {
      showToast(res?.error || 'Greška pri slanju poruke.');
    }
  };

  if (sendBtn) sendBtn.onclick = handleSend;
  if (dmInput) {
    dmInput.onkeypress = (e) => {
      if (e.key === 'Enter') handleSend();
    };
  }
}

function openNewChatModal() {
  let modal = document.getElementById('new-chat-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'new-chat-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 440px;">
        <div class="modal-header">
          <h3>Nova poruka</h3>
          <button class="icon-btn btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="search-bar-box" style="margin-bottom: 12px;">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="new-chat-search-input" placeholder="Pretraži korisnike po imenu ili nadimku..." class="styled-input">
          </div>
          <div id="new-chat-results" style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
            <!-- Lista korisnika -->
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('.btn-close-modal').forEach(b => {
      b.onclick = () => modal.classList.add('hidden');
    });
  }

  modal.classList.remove('hidden');

  const searchInput = document.getElementById('new-chat-search-input');
  const resultsBox = document.getElementById('new-chat-results');

  const loadUsers = async (q = '') => {
    if (resultsBox) {
      resultsBox.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 12px;"><i class="fa-solid fa-spinner fa-spin"></i> Tražim korisnike...</div>';
    }
    const data = await searchUsersAPI(q);
    if (!data || !data.users || data.users.length === 0) {
      if (resultsBox) {
        resultsBox.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">Niti jedan korisnik nije pronađen.</div>';
      }
      return;
    }

    if (resultsBox) {
      resultsBox.innerHTML = data.users.map(u => `
        <div class="user-search-row" data-user-id="${u.id}" data-user-nick="${u.nickname}" style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: var(--radius-sm); cursor: pointer; transition: background 0.2s;">
          <img src="${u.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" alt="${u.nickname}">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(u.full_name || u.nickname)}</div>
            <div style="font-size: 12px; color: var(--primary-blue);">@${escapeHTML(u.nickname)}</div>
          </div>
          <button class="btn-secondary" style="padding: 4px 12px; font-size: 12px;">Poruka</button>
        </div>
      `).join('');

      resultsBox.querySelectorAll('.user-search-row').forEach(row => {
        row.onclick = () => {
          const uId = parseInt(row.getAttribute('data-user-id'), 10);
          const uNick = row.getAttribute('data-user-nick');
          playSound('click');
          modal.classList.add('hidden');
          openChatWindow(uId || uNick);
        };
      });
    }
  };

  loadUsers('');

  let debounceTimer = null;
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
    searchInput.oninput = (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadUsers(e.target.value.trim());
      }, 250);
    };
  }
}

function formatChatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Upravo';
  if (diffMins < 60) return `${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
