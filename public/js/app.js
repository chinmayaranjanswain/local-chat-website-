/* ═══════════════════════════════════════════════════════════════
   ApniBaat — Client Application
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── State ─────────────────────────────────────────────────
  let socket = null;
  let currentUser = { name: '', color: '', room: '' };
  let typingTimeout = null;
  let isTyping = false;

  // ─── DOM References ────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);

  const dom = {
    // Screens
    landingScreen: $('#landing-screen'),
    chatScreen: $('#chat-screen'),

    // Landing
    joinForm: $('#join-form'),
    nameInput: $('#name-input'),
    nameCharCount: $('#name-char-count'),
    roomInput: $('#room-input'),
    roomCharCount: $('#room-char-count'),
    nameError: $('#name-error'),
    joinBtn: $('#join-btn'),
    serverUrlText: $('#server-url-text'),
    serverUrlBox: $('#server-url-box'),

    // Chat header
    onlineCount: $('#online-count'),
    roomBadge: $('#room-badge'),
    shareBtn: $('#share-btn'),
    leaveBtn: $('#leave-btn'),
    sidebarToggle: $('#sidebar-toggle'),

    // Sidebar
    sidebar: $('#users-sidebar'),
    sidebarCount: $('#sidebar-count'),
    sidebarClose: $('#sidebar-close'),
    usersList: $('#users-list'),

    // Messages
    messagesContainer: $('#messages-container'),
    typingIndicator: $('#typing-indicator'),

    // Input
    messageInput: $('#message-input'),
    msgCharCount: $('#msg-char-count'),
    sendBtn: $('#send-btn'),

    // Toast
    toast: $('#toast'),
  };

  // ─── Init ──────────────────────────────────────────────────
  function init() {
    fetchServerInfo();
    bindEvents();
    setupMobileViewport();
    dom.nameInput.focus();
  }

  // ─── Mobile Viewport Fix ───────────────────────────────────
  function setupMobileViewport() {
    if (!window.visualViewport) return;

    const chatScreen = dom.chatScreen;

    window.visualViewport.addEventListener('resize', () => {
      chatScreen.style.height = window.visualViewport.height + 'px';
      window.scrollTo(0, 0);
    });

    window.visualViewport.addEventListener('scroll', () => {
      window.scrollTo(0, 0);
    });

    dom.messageInput.addEventListener('focus', () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      }, 300);
    });

    dom.messageInput.addEventListener('blur', () => {
      setTimeout(() => {
        chatScreen.style.height = '';
        window.scrollTo(0, 0);
      }, 100);
    });
  }

  // ─── Server Info ───────────────────────────────────────────
  async function fetchServerInfo() {
    try {
      const res = await fetch('/api/info');
      const data = await res.json();
      dom.serverUrlText.textContent = data.url;
    } catch {
      dom.serverUrlText.textContent = window.location.origin;
    }
  }

  // ─── Event Bindings ────────────────────────────────────────
  function bindEvents() {
    // Join form
    dom.joinForm.addEventListener('submit', handleJoin);
    dom.nameInput.addEventListener('input', () => {
      const len = dom.nameInput.value.length;
      dom.nameCharCount.textContent = `${len}/24`;
      dom.nameError.textContent = '';
    });
    dom.roomInput.addEventListener('input', () => {
      const len = dom.roomInput.value.length;
      dom.roomCharCount.textContent = `${len}/50`;
      dom.nameError.textContent = '';
    });

    // Server URL copy
    dom.serverUrlBox.addEventListener('click', copyServerUrl);

    // Chat input
    dom.messageInput.addEventListener('input', handleMessageInput);
    dom.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    dom.sendBtn.addEventListener('click', sendMessage);

    // Header actions
    dom.shareBtn.addEventListener('click', shareRoomInfo);
    dom.leaveBtn.addEventListener('click', handleLeave);
    dom.sidebarToggle.addEventListener('click', toggleSidebar);
    dom.sidebarClose.addEventListener('click', closeSidebar);

    // Cleanup on exit
    window.addEventListener('beforeunload', () => {
      if (socket) socket.disconnect();
    });
  }

  // ─── Join Flow ─────────────────────────────────────────────
  function handleJoin(e) {
    e.preventDefault();
    const name = dom.nameInput.value.trim();
    const room = dom.roomInput.value.trim();

    if (!name) {
      dom.nameError.textContent = 'Please enter a display name.';
      dom.nameInput.focus();
      return;
    }

    if (!room) {
      dom.nameError.textContent = 'Please enter a room code.';
      dom.roomInput.focus();
      return;
    }

    dom.joinBtn.disabled = true;
    dom.joinBtn.querySelector('span').textContent = 'Joining...';

    // Connect socket
    socket = io();

    socket.on('connect', () => {
      socket.emit('user:join', { name, room }, (response) => {
        if (response.success) {
          currentUser.name = response.name;
          currentUser.color = response.color;
          currentUser.room = response.room;
          switchToChat();
        } else {
          dom.nameError.textContent = response.error;
          dom.joinBtn.disabled = false;
          dom.joinBtn.querySelector('span').textContent = 'Join Room';
        }
      });
    });

    socket.on('connect_error', () => {
      dom.nameError.textContent = 'Connection failed. Please try again.';
      dom.joinBtn.disabled = false;
      dom.joinBtn.querySelector('span').textContent = 'Join Room';
    });

    // Socket event listeners
    socket.on('error:duplicate_name', (msg) => {
      dom.nameError.textContent = msg;
      dom.joinBtn.disabled = false;
      dom.joinBtn.querySelector('span').textContent = 'Join Room';
      socket.disconnect();
      socket = null;
    });

    socket.on('error:invalid_name', (msg) => {
      dom.nameError.textContent = msg;
      dom.joinBtn.disabled = false;
      dom.joinBtn.querySelector('span').textContent = 'Join Room';
      socket.disconnect();
      socket = null;
    });

    socket.on('error:invalid_room', (msg) => {
      dom.nameError.textContent = msg;
      dom.joinBtn.disabled = false;
      dom.joinBtn.querySelector('span').textContent = 'Join Room';
      socket.disconnect();
      socket = null;
    });

    socket.on('message:history', (messages) => {
      messages.forEach(renderMessage);
      scrollToBottom();
    });

    socket.on('message:receive', (msg) => {
      renderMessage(msg);
      scrollToBottom();
    });

    socket.on('users:update', (users) => {
      renderOnlineUsers(users);
    });

    socket.on('user:typing', (data) => {
      showTypingIndicator(data);
    });

    socket.on('disconnect', () => {
      showToast('Disconnected from server');
    });
  }

  // ─── Leave Flow ────────────────────────────────────────────
  function handleLeave() {
    if (!socket) return;

    // Stop typing if active
    if (isTyping) {
      isTyping = false;
      socket.emit('user:typing', false);
    }
    if (typingTimeout) clearTimeout(typingTimeout);

    socket.emit('user:leave', () => {
      socket.disconnect();
      socket = null;
      currentUser = { name: '', color: '', room: '' };
      switchToLanding();
    });
  }

  // ─── Screen Transition ─────────────────────────────────────
  function switchToChat() {
    // Set room badge
    dom.roomBadge.textContent = currentUser.room;

    dom.landingScreen.classList.add('screen-exit');
    setTimeout(() => {
      dom.landingScreen.classList.remove('active', 'screen-exit');
      dom.chatScreen.classList.add('active', 'screen-enter');
      dom.messageInput.focus();

      // Add mobile sidebar overlay
      if (!$('#sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'sidebar-overlay';
        overlay.addEventListener('click', closeSidebar);
        document.body.appendChild(overlay);
      }
    }, 300);
  }

  function switchToLanding() {
    // Clear messages
    dom.messagesContainer.innerHTML = '';
    dom.typingIndicator.innerHTML = '';
    typingUsers.clear();

    // Reset form
    dom.joinBtn.disabled = false;
    dom.joinBtn.querySelector('span').textContent = 'Join Room';
    dom.nameError.textContent = '';

    // Transition
    dom.chatScreen.classList.add('screen-exit');
    setTimeout(() => {
      dom.chatScreen.classList.remove('active', 'screen-exit');
      dom.landingScreen.classList.add('active', 'screen-enter');
      dom.nameInput.focus();
    }, 300);
  }

  // ─── Message Rendering ─────────────────────────────────────
  function renderMessage(msg) {
    if (msg.type === 'system') {
      const el = document.createElement('div');
      el.className = 'message-system';
      el.textContent = msg.text;
      dom.messagesContainer.appendChild(el);
      return;
    }

    const isOwn = msg.name === currentUser.name;
    const el = document.createElement('div');
    el.className = `message ${isOwn ? 'own' : 'other'}`;

    const time = formatTime(msg.timestamp);

    el.innerHTML = `
      ${!isOwn ? `<div class="message-meta"><span class="message-sender" style="color: ${msg.color}">${escapeHtml(msg.name)}</span></div>` : ''}
      <div class="message-bubble">
        <div class="message-text">${linkify(escapeHtml(msg.text))}</div>
      </div>
      <div class="message-meta">
        <span class="message-time">${time}</span>
      </div>
    `;

    dom.messagesContainer.appendChild(el);
  }

  function formatTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      dom.messagesContainer.scrollTop = dom.messagesContainer.scrollHeight;
    });
  }

  // ─── Send Message ──────────────────────────────────────────
  function sendMessage() {
    const text = dom.messageInput.value.trim();
    if (!text || !socket) return;

    socket.emit('message:send', text);
    dom.messageInput.value = '';
    dom.msgCharCount.textContent = '0/500';
    dom.msgCharCount.classList.remove('visible');
    dom.sendBtn.disabled = true;

    // Stop typing
    if (isTyping) {
      isTyping = false;
      socket.emit('user:typing', false);
    }
    if (typingTimeout) clearTimeout(typingTimeout);
  }

  function handleMessageInput() {
    const len = dom.messageInput.value.length;
    dom.msgCharCount.textContent = `${len}/500`;
    dom.sendBtn.disabled = len === 0;

    if (len > 0) {
      dom.msgCharCount.classList.add('visible');
    } else {
      dom.msgCharCount.classList.remove('visible');
    }

    // Typing indicator
    if (!socket) return;
    if (!isTyping) {
      isTyping = true;
      socket.emit('user:typing', true);
    }
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping = false;
      socket.emit('user:typing', false);
    }, 2000);
  }

  // ─── Typing Indicator ─────────────────────────────────────
  const typingUsers = new Map();

  function showTypingIndicator(data) {
    if (data.isTyping) {
      typingUsers.set(data.name, true);
    } else {
      typingUsers.delete(data.name);
    }

    if (typingUsers.size === 0) {
      dom.typingIndicator.innerHTML = '';
      return;
    }

    const names = Array.from(typingUsers.keys());
    let text = '';
    if (names.length === 1) {
      text = `${names[0]} is typing`;
    } else if (names.length === 2) {
      text = `${names[0]} and ${names[1]} are typing`;
    } else {
      text = `${names.length} people are typing`;
    }

    dom.typingIndicator.innerHTML = `
      <span>${text}</span>
      <span class="typing-dots"><span></span><span></span><span></span></span>
    `;
  }

  // ─── Online Users ──────────────────────────────────────────
  function renderOnlineUsers(users) {
    const count = users.length;
    dom.onlineCount.textContent = `${count} online`;
    dom.sidebarCount.textContent = count;

    dom.usersList.innerHTML = '';
    users.forEach((user) => {
      const li = document.createElement('li');
      li.className = `user-item${user.name === currentUser.name ? ' is-you' : ''}`;
      li.innerHTML = `
        <span class="user-dot" style="background: ${user.color}"></span>
        <span class="user-name" style="color: ${user.color}">${escapeHtml(user.name)}</span>
      `;
      dom.usersList.appendChild(li);
    });
  }

  // ─── Sidebar ───────────────────────────────────────────────
  function toggleSidebar() {
    const isOpen = dom.sidebar.classList.contains('open');
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function openSidebar() {
    dom.sidebar.classList.add('open');
    dom.sidebarToggle.classList.add('active');
    const overlay = $('#sidebar-overlay');
    if (overlay) overlay.classList.add('show');
  }

  function closeSidebar() {
    dom.sidebar.classList.remove('open');
    dom.sidebarToggle.classList.remove('active');
    const overlay = $('#sidebar-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  // ─── Share Room Info ───────────────────────────────────────
  async function shareRoomInfo() {
    const shareText = `Join my ApniBaat room!\nRoom Code: ${currentUser.room}\nLink: ${window.location.origin}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ApniBaat Room', text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        showToast('✓ Room info copied to clipboard!');
      }
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareText;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      showToast('✓ Room info copied to clipboard!');
    }
  }

  // ─── Copy URL ──────────────────────────────────────────────
  async function copyServerUrl() {
    const url = dom.serverUrlText.textContent;
    try {
      await navigator.clipboard.writeText(url);
      showToast('✓ Link copied to clipboard!');
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      showToast('✓ Link copied to clipboard!');
    }
  }

  // ─── Toast ─────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 2500);
  }

  // ─── Boot ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
