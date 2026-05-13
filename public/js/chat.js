// chat.js file 
// responsibilities: handles user chat input and send actions, sends chat request to the backend API,
// manages active chats states, displays user and AI messages in the UI,
// intergreates docs uploaded, key board interactions, typing indicators, and receives real-time chat updates from socket.js

(function () {

  const messagesEl = document.getElementById('chat-messages');
  const inputEl    = document.getElementById('chat-input');
  const sendBtn    = document.getElementById('chat-send-btn');
  const newChatBtn = document.getElementById('btn-new-chat-header');
  const emptyState = document.getElementById('chat-empty-state');
  const titleEl    = document.getElementById('chat-session-title');

  // tracks whether current chat session has started
  let sessionStarted = false;

  // prevents multiple messages being sent while waiting for response
  let isWaiting = false;

  // dynamically resizes textarea and enables/disables send button
  inputEl.addEventListener('input', () => {
    sendBtn.disabled = inputEl.value.trim().length === 0;
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
  });

  // sends message when Enter is pressed and Shift+Enter creates a new line instead
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled && !isWaiting) sendMessage();
    }
  });

  sendBtn.addEventListener('click', () => {
    if (!sendBtn.disabled && !isWaiting) sendMessage();
  });

  newChatBtn.addEventListener('click', () => {
    if (typeof startNewChat === 'function') startNewChat();
  });

  // handles sending user messages to backend API
  async function sendMessage() {

    const text = inputEl.value.trim();
    if (!text || isWaiting) return;

    if (emptyState && emptyState.parentNode) {
      emptyState.remove();
    }

    if (!sessionStarted) {
      sessionStarted = true;
      titleEl.textContent = text.length > 50 ? text.slice(0, 47) + '…' : text;
    }

    // retrieve uploaded document IDs to include in chat request
    const documentIds = (typeof UploadModule !== 'undefined')
      ? UploadModule.getDocumentIds()
      : [];

    const attachedFiles = (typeof UploadModule !== 'undefined')
      ? UploadModule.getAttachedFiles()
      : [];

    // immediately render user's message in chat UI
    appendUserBubble(text, attachedFiles);

    inputEl.value = '';
    inputEl.style.height = 'auto';
    sendBtn.disabled = true;
    isWaiting = true;

    if (typeof UploadModule !== 'undefined') {
      UploadModule.clearAttachments();
    }

    // show temporary typing/loading indicator
    const typingEl = appendTyping();

    try {
      let chatId = state.currentSessionId;

      if (!chatId) {
        const createRes = await fetch('/api/chat/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + state.token
          },
          body: JSON.stringify({
            title: text.length > 50 ? text.slice(0, 50) : text,
          })
        });

        const createJson = await createRes.json();
        if (!createRes.ok) throw new Error(createJson.message || 'Could not start chat');

        chatId = createJson.data.chatId;
        state.currentSessionId = chatId;
      }

      const res = await fetch('/api/chat/' + chatId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.token
        },
        body: JSON.stringify({
          query: text,
          documentIds: documentIds.length ? documentIds : undefined
        })
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || 'Chat failed');

      const { messageId } = json.data;

      // receives live AI response updates from socket.js
      window._onChatUpdated = (payload) => {

        if (String(payload.messageId) !== String(messageId)) return;

        if (payload.status === 'completed') {
          removeTyping(typingEl);
const formatter = window.formatAiResponse || ((text) => `<p>${escapeHtml(text)}</p>`);

appendBubble(
  'ai',
  formatter(
    payload.response.answer,
    payload.response.citations
  )
);
          isWaiting = false;
          window._onChatUpdated = null;
        }

        if (payload.status === 'failed') {
          removeTyping(typingEl);
          appendBubble('ai', `<span style="color:red;">${escapeHtml(payload.error.message)}</span>`);
          isWaiting = false;
          window._onChatUpdated = null;
        }
      };

    } catch (err) {
      removeTyping(typingEl);
      appendBubble('ai', '<span style="color:red;">Something went wrong.</span>');
      isWaiting = false;
    }
  }

  // creates and displays a user chat bubble
  function appendUserBubble(text, files = []) {
    const row = document.createElement('div');
    row.className = 'msg-row user';

    const bubble = document.createElement('div');
    bubble.className = 'bubble user';

    let docs = '';

    if (files.length) {
      docs = `<div class="bubble-docs">
        ${files.map(f => `
          <div class="bubble-doc-chip">${escapeHtml(f.filename)}</div>
        `).join('')}
      </div>`;
    }

    bubble.innerHTML = docs + `<p>${escapeHtml(text)}</p>`;
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollBottom();
  }

  // creates and displays a generic chat bubble, used for AI responses and system messages
  function appendBubble(role, html) {
    const row = document.createElement('div');
    row.className = 'msg-row ' + role;

    const bubble = document.createElement('div');
    bubble.className = 'bubble ' + role;
    bubble.innerHTML = html;

    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollBottom();
  }

  // displays temporary typing indicator while waiting for response
  function appendTyping() {
    const row = document.createElement('div');
    row.innerHTML = `<div class="typing">...</div>`;
    messagesEl.appendChild(row);
    scrollBottom();
    return row;
  }

  function removeTyping(el) {
    if (el?.remove) el.remove();
  }

  // automatically scrolls chat to latest message
  function scrollBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // prevents HTML injection by escaping special characters
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

})();