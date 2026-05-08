(function () {
  const messagesEl   = document.getElementById('chat-messages');
  const inputEl      = document.getElementById('chat-input');
  const sendBtn      = document.getElementById('chat-send-btn');
  const newChatBtn   = document.getElementById('btn-new-chat-header');
  const emptyState   = document.getElementById('chat-empty-state');
  const titleEl      = document.getElementById('chat-session-title');
 
  // track whether we've sent the first message in this session
  let sessionStarted = false;
  let isWaiting = false;
 
  // textarea
  inputEl.addEventListener('input', () => {
    // enable send button only when there's text
    sendBtn.disabled = inputEl.value.trim().length === 0;
 
    // auto-grow textarea up to 5 lines
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
  });
 
  // send on enter (Shift+Enter = new line)
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled && !isWaiting) sendMessage();
    }
  });
 
  sendBtn.addEventListener('click', () => {
    if (!sendBtn.disabled && !isWaiting) sendMessage();
  });

  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      inputEl.value = chip.dataset.q;
      inputEl.dispatchEvent(new Event('input'));
      sendMessage();
    });
  });
 
  // new chat (header button)
  newChatBtn.addEventListener('click', () => {
    if (typeof startNewChat === 'function') startNewChat();
  });
 
function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isWaiting) return;
 
    if (emptyState && emptyState.parentNode) {
      emptyState.remove();
      sessionStarted = false;
    }
 
    if (!sessionStarted) {
      sessionStarted = true;
      const short = text.length > 50 ? text.slice(0, 47) + '…' : text;
      titleEl.textContent = short;
    }
 
    appendBubble('user', escapeHtml(text));
 
    inputEl.value = '';
    inputEl.style.height = 'auto';
    sendBtn.disabled = true;
    isWaiting = true;
 
    const typingEl = appendTyping();

    // listen for the backend's response via socket
    window._onChatResponse = (payload) => {
      removeTyping(typingEl);
      appendBubble('ai', formatAiResponse(payload.answer, payload.citations));
      if (payload.sessionId) state.currentSessionId = payload.sessionId;
      isWaiting = false;
      window._onChatResponse = null; 
    };

    // send to backend via socket
    ChatSocket.sendMessage(text, state.currentSessionId);
  }

  // render helpers 
  function appendBubble(role, htmlContent) {
    const row = document.createElement('div');
    row.className = 'msg-row ' + role;
 
    const bubble = document.createElement('div');
    bubble.className = 'bubble ' + role;
    bubble.innerHTML = htmlContent;
 
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollToBottom();
    return row;
  }
 
  function appendTyping() {
    const row = document.createElement('div');
    row.className = 'msg-row';
    row.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
    messagesEl.appendChild(row);
    scrollToBottom();
    return row;
  }
 
  function removeTyping(el) {
    if (el && el.parentNode) el.remove();
  }
 
  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  window.formatAiResponse = function (answer, citations = []) {
    let html = escapeHtml(answer);
 
    // replace markers with citation badges
    html = html.replace(/\[(\d+)\]/g, (match, num) => {
      const cite = citations.find(c => String(c.id) === num);
      const label = cite ? cite.source : '§' + num;
      const href  = cite ? ` title="${escapeHtml(cite.source)}"` : '';
      return `<span class="citation"${href}>§${num}</span>`;
    });
 
    // preserve line breaks
    html = html.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
  };

  // utilities 
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  window.ChatModule = { sendMessage };
})();