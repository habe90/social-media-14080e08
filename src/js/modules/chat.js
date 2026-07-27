// SELAMY - DIRECT MESSAGES (CHAT) MODULE

import { state } from '../state.js';
import { playSound } from '../utils/sound.js';

export function initChatModule() {
  renderChatsList();
}

export function renderChatsList() {
  const container = document.getElementById('chats-list');
  if (!container) return;

  container.innerHTML = '';

  state.chats.forEach(chat => {
    const item = document.createElement('div');
    item.className = `chat-item ${state.activeChatId === chat.id ? 'active' : ''}`;
    const lastMsg = chat.messages[chat.messages.length - 1];

    item.innerHTML = `
      <img src="${chat.avatar}" alt="${chat.username}">
      <div class="chat-meta">
        <span class="chat-name">${chat.username}</span>
        <span class="chat-preview">${lastMsg ? lastMsg.text : 'Nema poruka'}</span>
      </div>
    `;

    item.onclick = () => {
      openChatWindow(chat.id);
    };
    container.appendChild(item);
  });
}

export function openChatWindow(chatId) {
  state.activeChatId = chatId;
  const chat = state.chats.find(c => c.id === chatId);
  if (!chat) return;

  renderChatsList();

  const emptyState = document.getElementById('empty-chat-state');
  const activeContent = document.getElementById('active-chat-content');

  if (emptyState) emptyState.classList.add('hidden');
  if (activeContent) {
    activeContent.classList.remove('hidden');

    activeContent.innerHTML = `
      <div class="chat-header-top">
        <img src="${chat.avatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" alt="${chat.username}">
        <strong>${chat.username}</strong>
      </div>
      <div class="chat-messages-area" id="msg-area">
        ${chat.messages.map(m => `
          <div class="msg-bubble ${m.isMine ? 'outgoing' : 'incoming'}">
            ${m.text}
          </div>
        `).join('')}
      </div>
      <div class="chat-input-row">
        <input type="text" id="dm-input" placeholder="Napišite poruku...">
        <button class="btn-primary" id="btn-send-dm"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    `;

    const msgArea = document.getElementById('msg-area');
    if (msgArea) msgArea.scrollTop = msgArea.scrollHeight;

    const dmInput = document.getElementById('dm-input');
    const sendBtn = document.getElementById('btn-send-dm');

    const sendDM = () => {
      const text = dmInput.value.trim();
      if (!text) return;

      playSound('message_send');

      chat.messages.push({
        text: text,
        time: 'Upravo',
        isMine: true
      });

      dmInput.value = '';
      openChatWindow(chatId);

      setTimeout(() => {
        playSound('message_receive');
        chat.messages.push({
          text: 'Hvala ti na poruci! Super zvuči 👍',
          time: 'Upravo',
          isMine: false
        });
        openChatWindow(chatId);
      }, 1500);
    };

    if (sendBtn && dmInput) {
      sendBtn.onclick = sendDM;
      dmInput.onkeypress = (e) => {
        if (e.key === 'Enter') sendDM();
      };
    }
  }
}
