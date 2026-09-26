/**
 * chat.js — Floating AI Career Mentor Chatbot Widget
 * Team 404 Brain Not Found · CareerPath AI Platform
 */

(function () {
  const STORAGE_KEY = 'cp_chat_history_v1';
  let chatHistory = [];
  let isSending = false;

  // Initialize from sessionStorage if exists
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      chatHistory = Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    chatHistory = [];
  }

  function getApiBaseUrl() {
    if (window.CONFIG && window.CONFIG.API_BASE_URL) {
      return window.CONFIG.API_BASE_URL;
    }
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return isLocalhost ? 'http://localhost:5000/api' : 'https://careerpath-ai-bdbt.onrender.com/api';
  }

  function getAuthToken() {
    if (window.Auth && typeof window.Auth.getToken === 'function') {
      return window.Auth.getToken();
    }
    return localStorage.getItem('careerpath_token') || localStorage.getItem('token') || null;
  }

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Basic markdown-to-HTML parser for AI responses
  function parseMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Split by double newline for paragraphs
    const paragraphs = html.split(/\n\n+/);
    return paragraphs.map(p => {
      // Check for bullet lines
      if (p.trim().startsWith('* ') || p.trim().startsWith('- ')) {
        const items = p.split(/\n/).map(line => {
          const clean = line.replace(/^[\*\-]\s+/, '').trim();
          return clean ? `<li>${clean}</li>` : '';
        }).join('');
        return `<ul>${items}</ul>`;
      }
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('');
  }

  function injectWidgetDOM() {
    if (document.getElementById('cpChatDrawer')) return;

    // 1. Trigger button (VengeanceUI Creepy eye-tracking AI Mentor)
    const trigger = document.createElement('button');
    trigger.id = 'cpChatTrigger';
    trigger.className = 'cp-chat-trigger cp-creepy-mentor-btn';
    trigger.setAttribute('aria-label', 'Open AI Career Mentor Chat');
    trigger.innerHTML = `
      <span class="cp-creepy-eyes-container" aria-hidden="true">
        <span class="cp-creepy-eye cp-creepy-eye-left">
          <span class="cp-creepy-pupil"></span>
        </span>
        <span class="cp-creepy-eye cp-creepy-eye-right">
          <span class="cp-creepy-pupil"></span>
        </span>
      </span>
      <span class="cp-creepy-cover">
        <span class="trigger-icon"><i class="bi bi-robot"></i></span>
        <span class="trigger-label">AI Mentor</span>
        <span class="trigger-badge"><span class="badge-dot"></span>ONLINE</span>
      </span>
      <span class="cp-creepy-placeholder" aria-hidden="true">
        <span class="trigger-icon"><i class="bi bi-robot"></i></span>
        <span class="trigger-label">AI Mentor</span>
        <span class="trigger-badge"><span class="badge-dot"></span>ONLINE</span>
      </span>
    `;
    document.body.appendChild(trigger);

    // 2. Chat drawer
    const drawer = document.createElement('div');
    drawer.id = 'cpChatDrawer';
    drawer.className = 'cp-chat-drawer';
    drawer.innerHTML = `
      <div class="cp-chat-header">
        <div class="cp-chat-header-info">
          <div class="cp-chat-avatar">
            <i class="bi bi-robot"></i>
          </div>
          <div>
            <h4 class="cp-chat-title">CareerPath AI Mentor</h4>
            <div class="cp-chat-subtitle">
              <span class="pulse-dot"></span> Online · CareerPath AI Assistant
            </div>
          </div>
        </div>
        <div class="cp-chat-header-actions">
          <button class="cp-chat-btn-icon" id="cpChatClearBtn" title="Clear conversation" aria-label="Clear chat">
            <i class="bi bi-trash3"></i>
          </button>
          <button class="cp-chat-btn-icon" id="cpChatCloseBtn" title="Close chat" aria-label="Close chat">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <div class="cp-chat-messages" id="cpChatMessages">
        <!-- Messages rendered here -->
      </div>

      <div class="cp-chat-suggestions" id="cpChatSuggestions">
        <span class="cp-chat-suggestions-title">Quick Career Prompts:</span>
        <button class="cp-chat-chip" data-prompt="Which tech role has the highest industry demand right now?">
          ⚡ Which tech role has the highest industry demand?
        </button>
        <button class="cp-chat-chip" data-prompt="How should a fresher prepare for a Full-Stack Developer role in 8 weeks?">
          🎯 How to prepare for Full-Stack Developer in 8 weeks?
        </button>
        <button class="cp-chat-chip" data-prompt="What portfolio projects impress hiring managers most?">
          🛠️ What portfolio projects impress hiring managers?
        </button>
      </div>

      <div class="cp-chat-footer">
        <form class="cp-chat-form" id="cpChatForm">
          <input
            type="text"
            id="cpChatInput"
            class="cp-chat-input"
            placeholder="Ask AI Career Mentor anything..."
            autocomplete="off"
            maxlength="400"
          />
          <button type="submit" class="cp-chat-send-btn" id="cpChatSendBtn" aria-label="Send message">
            <i class="bi bi-send-fill"></i>
          </button>
        </form>
        <p class="cp-chat-disclaimer">CareerPath AI Assistant · Team 404 Brain Not Found</p>
      </div>
    `;
    document.body.appendChild(drawer);

    // 3. Interactive Career Question Pop-up Card
    // 3. Interactive Pop-Up Nudge Tooltip & Career Question Card
    const nudge = document.createElement('div');
    nudge.id = 'cpChatNudge';
    nudge.className = 'cp-chat-question-popup d-none';
    nudge.innerHTML = `
      <div class="cp-chat-question-header">
        <span class="cp-chat-question-badge">
          <i class="bi bi-robot"></i> AI Mentor
        </span>
        <button class="cp-question-close" id="cpQuestionClose" title="Dismiss">&times;</button>
      </div>
      <p class="cp-chat-question-title">💬 <strong>Need advice?</strong> Ask AI Mentor!</p>
      <div class="cp-chat-question-list">
        <button class="cp-question-item-btn" data-q="Which tech role has the highest industry demand right now?">
          <span>⚡ Which role has highest demand?</span>
          <i class="bi bi-arrow-right-short q-arrow"></i>
        </button>
        <button class="cp-question-item-btn" data-q="How should a fresher prepare for a Full-Stack role in 8 weeks?">
          <span>🎯 How to prepare in 8 weeks?</span>
          <i class="bi bi-arrow-right-short q-arrow"></i>
        </button>
        <button class="cp-question-item-btn" data-q="What portfolio projects impress tech recruiters most?">
          <span>🛠️ Best portfolio projects to build?</span>
          <i class="bi bi-arrow-right-short q-arrow"></i>
        </button>
      </div>
      <div class="cp-chat-question-tail"></div>
    `;
    document.body.appendChild(nudge);

    // Show popup tooltip after 2.5 seconds if chat hasn't been opened
    setTimeout(() => {
      if (!drawer.classList.contains('open') && !sessionStorage.getItem('cp_nudge_dismissed')) {
        nudge.classList.remove('d-none');
      }
    }, 2500);

    bindEvents(trigger, drawer, nudge);
    renderMessages();
  }

  function bindEvents(trigger, drawer, nudge) {
    const closeBtn = document.getElementById('cpChatCloseBtn');
    const clearBtn = document.getElementById('cpChatClearBtn');
    const form = document.getElementById('cpChatForm');
    const input = document.getElementById('cpChatInput');
    const suggestions = document.getElementById('cpChatSuggestions');
    const questionClose = document.getElementById('cpQuestionClose');

    function dismissNudge() {
      if (nudge) {
        nudge.classList.add('dismissed');
        setTimeout(() => nudge.remove(), 350);
        try { sessionStorage.setItem('cp_nudge_dismissed', 'true'); } catch (e) {}
      }
    }

    if (nudge) {
      nudge.addEventListener('click', (e) => {
        if (e.target.closest('#cpQuestionClose')) {
          dismissNudge();
          return;
        }

        const qBtn = e.target.closest('.cp-question-item-btn');
        if (qBtn) {
          const prompt = qBtn.getAttribute('data-q');
          dismissNudge();
          drawer.classList.add('open');
          scrollToBottom();
          if (prompt) {
            sendUserMessage(prompt);
          }
          return;
        }

        dismissNudge();
        drawer.classList.add('open');
        input.focus();
        scrollToBottom();
      });
    }

    // Toggle drawer
    trigger.addEventListener('click', () => {
      dismissNudge();
      const isOpen = drawer.classList.contains('open');
      if (isOpen) {
        drawer.classList.remove('open');
      } else {
        drawer.classList.add('open');
        input.focus();
        scrollToBottom();
      }
    });

    closeBtn.addEventListener('click', () => {
      drawer.classList.remove('open');
    });

    // Clear history
    clearBtn.addEventListener('click', () => {
      chatHistory = [];
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      renderMessages();
    });

    // Handle form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || isSending) return;
      input.value = '';
      sendUserMessage(text);
    });

    // Handle suggested chips
    suggestions.addEventListener('click', (e) => {
      const chip = e.target.closest('.cp-chat-chip');
      if (chip && !isSending) {
        const prompt = chip.dataset.prompt;
        if (prompt) {
          sendUserMessage(prompt);
        }
      }
    });

    // Dynamic Eye Tracking for VengeanceUI Creepy AI Mentor Button
    function updateCreepyEyes(e) {
      const pupils = trigger.querySelectorAll('.cp-creepy-pupil');
      if (!pupils.length) return;

      const rect = trigger.getBoundingClientRect();
      const eyesX = rect.left + rect.width - 24;
      const eyesY = rect.top + rect.height * 0.5;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = clientX - eyesX;
      const dy = clientY - eyesY;
      const angle = Math.atan2(-dy, dx) + Math.PI / 2;
      const distance = Math.hypot(dx, dy);

      const visionRangeX = 260;
      const visionRangeY = 140;
      const normX = (Math.sin(angle) * Math.min(distance, visionRangeX)) / visionRangeX;
      const normY = (Math.cos(angle) * Math.min(distance, visionRangeY)) / visionRangeY;

      const px = normX * 4;
      const py = normY * 4;

      pupils.forEach((p) => {
        p.style.transform = `translate(calc(-50% + ${px.toFixed(1)}px), calc(-50% + ${py.toFixed(1)}px))`;
      });
    }

    window.addEventListener('mousemove', updateCreepyEyes, { passive: true });
    window.addEventListener('touchmove', updateCreepyEyes, { passive: true });

    trigger.addEventListener('mouseleave', () => {
      const pupils = trigger.querySelectorAll('.cp-creepy-pupil');
      pupils.forEach((p) => {
        p.style.transform = 'translate(-50%, -50%)';
      });
    });
  }

  function renderMessages() {
    const container = document.getElementById('cpChatMessages');
    const suggestions = document.getElementById('cpChatSuggestions');
    if (!container) return;

    container.innerHTML = '';

    // Welcome greeting
    const welcomeRow = document.createElement('div');
    welcomeRow.className = 'cp-chat-row ai';
    welcomeRow.innerHTML = `
      <div class="cp-chat-bubble">
        <p>👋 <strong>Welcome to CareerPath AI!</strong></p>
        <p>I am your <strong>AI Career Mentor</strong>. Ask me about tech careers, roadmap doubts, skill gaps, or interview strategies!</p>
      </div>
      <span class="cp-chat-time">Just now</span>
    `;
    container.appendChild(welcomeRow);

    // Render stored history
    for (const msg of chatHistory) {
      appendBubbleToDOM(msg.role, msg.text, msg.time, false);
    }

    if (suggestions) {
      suggestions.style.display = chatHistory.length > 2 ? 'none' : 'flex';
    }

    scrollToBottom();
  }

  function appendBubbleToDOM(role, text, time = formatTime(), shouldScroll = true) {
    const container = document.getElementById('cpChatMessages');
    if (!container) return;

    const row = document.createElement('div');
    row.className = `cp-chat-row ${role}`;

    const content = role === 'ai' ? parseMarkdown(text) : `<p>${escapeHtml(text)}</p>`;

    row.innerHTML = `
      <div class="cp-chat-bubble">
        ${content}
      </div>
      <span class="cp-chat-time">${time}</span>
    `;

    container.appendChild(row);
    if (shouldScroll) scrollToBottom();
  }

  function showTypingIndicator() {
    const container = document.getElementById('cpChatMessages');
    if (!container) return;

    removeTypingIndicator();

    const indicator = document.createElement('div');
    indicator.id = 'cpChatTypingIndicator';
    indicator.className = 'cp-chat-row ai';
    indicator.innerHTML = `
      <div class="cp-chat-typing">
        <div class="cp-chat-typing-dot"></div>
        <div class="cp-chat-typing-dot"></div>
        <div class="cp-chat-typing-dot"></div>
      </div>
    `;
    container.appendChild(indicator);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const existing = document.getElementById('cpChatTypingIndicator');
    if (existing) existing.remove();
  }

  function scrollToBottom() {
    const container = document.getElementById('cpChatMessages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async function sendUserMessage(text) {
    isSending = true;
    const time = formatTime();

    // 1. Add user bubble to DOM & history
    appendBubbleToDOM('user', text, time);
    chatHistory.push({ role: 'user', text, time });

    // Hide suggestions after first query
    const suggestions = document.getElementById('cpChatSuggestions');
    if (suggestions) suggestions.style.display = 'none';

    // 2. Show typing indicator
    showTypingIndicator();

    try {
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Format previous history for AI Mentor API (excluding current query to prevent duplication)
      const previousHistory = chatHistory.slice(0, -1);
      const historyPayload = previousHistory.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch(`${getApiBaseUrl()}/chat/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          history: historyPayload
        })
      });

      const data = await res.json();
      removeTypingIndicator();

      if (data.success && data.reply) {
        const aiTime = formatTime();
        appendBubbleToDOM('ai', data.reply, aiTime);
        chatHistory.push({ role: 'ai', text: data.reply, time: aiTime });
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory.slice(-20)));
        } catch (e) {}
      } else {
        const errorMsg = data.message || 'Sorry, I could not process your question right now. Please try again.';
        appendBubbleToDOM('ai', `⚠️ ${errorMsg}`, formatTime());
      }
    } catch (err) {
      removeTypingIndicator();
      console.error('Chatbot error:', err);
      appendBubbleToDOM(
        'ai',
        '⚠️ Could not connect to CareerPath AI backend server. Please verify the server is running on port 5000.',
        formatTime()
      );
    } finally {
      isSending = false;
      const input = document.getElementById('cpChatInput');
      if (input) input.focus();
    }
  }

  // Mount on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidgetDOM);
  } else {
    injectWidgetDOM();
  }

  window.CareerPathChat = {
    open: () => document.getElementById('cpChatDrawer')?.classList.add('open'),
    close: () => document.getElementById('cpChatDrawer')?.classList.remove('open'),
    send: (prompt) => sendUserMessage(prompt)
  };
})();
