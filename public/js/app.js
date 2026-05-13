// app.js file
// responsibilities: the main application logic, app state, page routing and sidebar navigation, authenication (login/register/logout), 
// toast notifications, home page (recent chats), history page (paginated chat list from API), 
// my documents page (document list from API), helper functions

// APP STATE: read by chat.js (token, currentSessionId) and upload.js (token, currentSessionId).
const state = {
  currentUser:      null,   // { id, email, role } from backend
  currentPage:      'login',
  currentSessionId: null,   // chatId of the active conversation
  token:            null,   // JWT from login — used in all API calls
};

// in-memory cache of history sessions (loaded from API)
let historyCache = [];

// page navigation: shows/hides inner pages and keeps sidebar in sync
function navigateTo(page) {
  // hide all inner pages
  document.querySelectorAll('.inner-page').forEach(p => p.classList.add('hidden'));

  // remove active highlight from all sidebar nav buttons
  document.querySelectorAll('.sb-item[data-page]').forEach(b => b.classList.remove('active'));

  // show the target page
  const target = document.getElementById('page-' + page);
  if (target) target.classList.remove('hidden');

  // highlight the matching sidebar button
  const sbBtn = document.querySelector('.sb-item[data-page="' + page + '"]');
  if (sbBtn) sbBtn.classList.add('active');

  state.currentPage = page;

  // trigger page-specific data loading
  if (page === 'home')      renderHomeRecent();
  if (page === 'history')   loadHistory();
  if (page === 'documents') loadDocuments();
}

// authentication pages: showAuthPage(page) and enterApp(user, token) toggle between login/register/home screens, 
// store user and token, connect socket, and set up home page greeting.
function showAuthPage(which) {
  document.getElementById('page-login').classList.toggle('hidden', which !== 'login');
  document.getElementById('page-register').classList.toggle('hidden', which !== 'register');
  document.getElementById('app-shell').classList.add('hidden');
}

// enterApp: called after successful login, stores user + token, connects socket, navigates to home.
function enterApp(user, token) {
  state.currentUser = user;
  state.token = token;

  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-register').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');

  // use email prefix as display name (backend user has no name field)
  const displayName = user.email.split('@')[0];
  document.getElementById('home-greeting').textContent = 'Hello, ' + displayName + ' ';
  document.getElementById('sb-avatar-initials').textContent = displayName.charAt(0).toUpperCase();

  // connect socket with JWT for real-time chat + document events
  ChatSocket.connect(token);

  navigateTo('home');
}

// toast notifications: showToast(msg, type) displays a temporary message at the bottom of the screen. 
// 'success' (green) or 'error' (red)
// Auto-hides after 3 seconds.
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

// login page handlers
document.getElementById('btn-login').addEventListener('click', async () => {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.classList.add('hidden');

  if (!email || !password) {
    errEl.textContent = 'Please enter your email and password.';
    errEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('btn-login');
  btn.textContent = 'Signing in…';
  btn.disabled = true;

  try {
    // POST /api/auth/login
    // body: { email, password }
    // response: { success: true, data: { token, expiresIn, user } }
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || 'Login failed. Please try again.');

    const { token, user } = json.data;
    enterApp(user, token);

  } catch (err) {
    errEl.textContent = err.message || 'Login failed. Please try again.';
    errEl.classList.remove('hidden');
  } finally {
    btn.textContent = 'Sign in';
    btn.disabled = false;
  }
});

document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});

document.getElementById('link-to-register').addEventListener('click', e => {
  e.preventDefault();
  showAuthPage('register');
});

// register page handelrs
document.getElementById('btn-register').addEventListener('click', async () => {
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl    = document.getElementById('register-error');
  errEl.classList.add('hidden');

  if (!email || !password) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.classList.remove('hidden');
    return;
  }
  if (password.length < 8) {
    errEl.textContent = 'Password must be at least 8 characters.';
    errEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('btn-register');
  btn.textContent = 'Creating account…';
  btn.disabled = true;

  try {
    // POST /api/auth/register
    // body: { email, password } — no name field
    // response: { success: true, data: { id, email, role, createdAt, updatedAt } }
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || 'Registration failed. Please try again.');

    // registration doesn't return a token — redirect to login
    showToast('Account created! Please sign in.');
    showAuthPage('login');
    document.getElementById('login-email').value = email;

  } catch (err) {
    errEl.textContent = err.message || 'Registration failed. Please try again.';
    errEl.classList.remove('hidden');
  } finally {
    btn.textContent = 'Create account';
    btn.disabled = false;
  }
});

document.getElementById('link-to-login').addEventListener('click', e => {
  e.preventDefault();
  showAuthPage('login');
});

// sidebar navigation buttons
document.querySelectorAll('.sb-item[data-page]').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.getAttribute('data-page');
    // 'chat' always starts a fresh session
    if (page === 'chat') {
      startNewChat();
    } else {
      navigateTo(page);
    }
  });
});

// quick action cards on home page
document.querySelectorAll('.qa-card[data-page]').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.getAttribute('data-page')));
});

// logout — call backend, disconnect socket, clear state
document.getElementById('btn-logout').addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + state.token }
    });
  } catch (err) {
    console.warn('[logout] API call failed, proceeding anyway:', err.message);
  }

  ChatSocket.disconnect();
  state.currentUser      = null;
  state.currentSessionId = null;
  state.token            = null;
  historyCache           = [];

  showAuthPage('login');
  showToast('Signed out successfully');
});

// home page
// Shows the 3 most recent chats from the history cache.
function renderHomeRecent() {
  const list   = document.getElementById('home-recent-list');
  const recent = historyCache.slice(0, 3);

  if (!recent.length) {
    list.innerHTML = '<p class="empty-state" style="padding:16px 0;">No conversations yet — start a new chat!</p>';
    return;
  }

  list.innerHTML = recent.map(item => `
    <div class="recent-item" data-id="${item._id}">
      <div class="recent-item-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div class="recent-item-body">
        <p class="recent-title">${escapeHtml(item.title || 'Untitled chat')}</p>
        <p class="recent-preview">${formatDate(item.lastMessageAt)}</p>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.recent-item').forEach(el => {
    el.addEventListener('click', () => resumeSession(el.dataset.id));
  });
}

document.getElementById('home-new-chat').addEventListener('click', () => startNewChat());

document.getElementById('home-view-all').addEventListener('click', e => {
  e.preventDefault();
  navigateTo('history');
});

document.getElementById('home-ask-send').addEventListener('click', () => {
  const q = document.getElementById('home-ask-input').value.trim();
  if (q) startNewChat(q);
});
document.getElementById('home-ask-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('home-ask-send').click();
});

// history page: fetches paginated chat list from GET /api/history and renders it. Also has client-side search and filter chips.
async function loadHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '<p class="empty-state">Loading…</p>';

  try {
    // GET /api/chat
    // response: { success: true, data: { chats: [...], pagination: {...} } }
    const res  = await fetch('/api/chat', {
      headers: { 'Authorization': 'Bearer ' + state.token }
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || 'Could not load history');

    const chats = json.data.chats;

    // cache for the home page recent list
    historyCache = chats;

    renderHistory(chats);

  } catch (err) {
    list.innerHTML = '<p class="empty-state">Could not load history. Please try again.</p>';
    console.error('[app.js] loadHistory error:', err);
  }
}

// renderHistory — builds the conversation list from an array of chat objects
// chat shape from backend: { _id, title, lastMessageAt, createdAt, updatedAt }
function renderHistory(chats) {
  const list = document.getElementById('history-list');

  if (!chats.length) {
    list.innerHTML = '<p class="empty-state">No conversations yet. Start a new chat to begin.</p>';
    return;
  }

  list.innerHTML = chats.map(item => `
    <div class="history-item" data-id="${item._id}">
      <div class="history-item-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div class="history-item-body">
        <p class="history-conv">${escapeHtml(item.title || 'Untitled chat')}</p>
        <p class="history-preview">${formatDate(item.lastMessageAt)}</p>
      </div>
      <span class="history-date">${formatDate(item.createdAt)}</span>
      <div class="history-actions">
        <button class="btn-sm btn-resume" data-id="${item._id}">Resume</button>
        <button class="btn-sm btn-delete" data-id="${item._id}">Delete</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.btn-resume').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); resumeSession(btn.dataset.id); });
  });

  list.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); deleteSession(btn.dataset.id); });
  });
}

// search: filter the cached list client-side
document.getElementById('history-search').addEventListener('input', e => {
  const q        = e.target.value.toLowerCase();
  const filtered = historyCache.filter(s => (s.title || '').toLowerCase().includes(q));
  renderHistory(filtered);
});

// filter chips
document.getElementById('filter-chips').addEventListener('click', e => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;

  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');

  const now = new Date();
  let filtered = historyCache;

  if (chip.dataset.filter === 'week') {
    filtered = historyCache.filter(s => (now - new Date(s.lastMessageAt)) < 7 * 86400000);
  } else if (chip.dataset.filter === 'month') {
    filtered = historyCache.filter(s => (now - new Date(s.lastMessageAt)) < 30 * 86400000);
  }

  renderHistory(filtered);
});

// my documents page: fetches document list from GET /api/documents, renders it, and handles deletion. 
// Document shape from backend: { _id, filename, mimeType, size, status, createdAt, chat }
async function loadDocuments() {
  const loadingEl = document.getElementById('docs-loading');
  const emptyEl   = document.getElementById('docs-empty');
  const listEl    = document.getElementById('docs-list');

  // show loading state
  loadingEl.classList.remove('hidden');
  emptyEl.classList.add('hidden');
  listEl.innerHTML = '';

  try {
    // GET /api/documents
    // response: { success: true, data: { documents: [{ _id, filename, mimeType, size, status, createdAt, chat }] } }
    const res  = await fetch('/api/documents', {
      headers: { 'Authorization': 'Bearer ' + state.token }
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || 'Could not load documents');

    const documents = json.data.documents || [];
    loadingEl.classList.add('hidden');

    if (!documents.length) {
      emptyEl.classList.remove('hidden');
      return;
    }

    renderDocuments(documents);

  } catch (err) {
    loadingEl.classList.add('hidden');
    listEl.innerHTML = '<p class="empty-state">Could not load documents. Please try again.</p>';
    console.error('[app.js] loadDocuments error:', err);
  }
}

// renderDocuments — builds the document list
// document shape: { _id, filename, mimeType, size, status, createdAt, chat }
function renderDocuments(documents) {
  const listEl = document.getElementById('docs-list');

  listEl.innerHTML = documents.map(doc => `
    <div class="doc-item" data-id="${doc._id}">

      <!-- file icon -->
      <div class="doc-item-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>

      <!-- filename + meta -->
      <div class="doc-item-body">
        <p class="doc-filename">${escapeHtml(doc.filename)}</p>
        <p class="doc-meta">${formatBytes(doc.size)} · ${formatDate(doc.createdAt)}</p>
      </div>

      <!-- processing status badge -->
      <span class="doc-status doc-status--${doc.status}">${doc.status}</span>

      <!-- delete button -->
      <button class="doc-delete" data-id="${doc._id}" title="Delete document">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>

    </div>
  `).join('');

  // wire up delete buttons
  listEl.querySelectorAll('.doc-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteDocument(btn.dataset.id));
  });
}

// deleteDocument — removes a document from the backend and reloads the list
async function deleteDocument(documentId) {
  try {
    // DELETE /api/documents/:id
    const res = await fetch('/api/documents/' + documentId, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + state.token }
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || 'Delete failed');
    }

    showToast('Document deleted');
    loadDocuments(); // refresh the list

  } catch (err) {
    showToast('Could not delete document', 'error');
    console.error('[app.js] deleteDocument error:', err);
  }
}

// HELPERS
// startNewChat — resets chat page to blank state, clears the attachment panel and session ID.
function startNewChat(initialMessage = null) {
  state.currentSessionId = null;

  // clear any attached documents from the previous chat
  if (typeof UploadModule !== 'undefined') {
    UploadModule.clearAttachments();
  }

  navigateTo('chat');
  document.getElementById('chat-session-title').textContent = 'New conversation';

  // restore the empty state prompt
  const messages  = document.getElementById('chat-messages');
  messages.innerHTML = '';
  const empty = document.getElementById('chat-empty-state');
  if (empty) messages.appendChild(empty);

  if (typeof initialMessage === 'string' && initialMessage.trim()) {
    const input = document.getElementById('chat-input');
    input.value = initialMessage;
    input.dispatchEvent(new Event('input'));
    setTimeout(() => document.getElementById('chat-send-btn').click(), 100);
  }
}

// resumeSession — loads a past chat into the chat page.
async function resumeSession(chatId) {
  state.currentSessionId = chatId;

  // clear attachments from any previous session
  if (typeof UploadModule !== 'undefined') {
    UploadModule.clearAttachments();
  }

  navigateTo('chat');

  // find the title from the cache
  const session = historyCache.find(s => s._id === chatId);
  document.getElementById('chat-session-title').textContent =
    session ? (session.title || 'Untitled chat') : 'Conversation';

  // load past messages
  try {
    const res  = await fetch('/api/chat/' + chatId, {
      headers: { 'Authorization': 'Bearer ' + state.token }
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || 'Could not load messages');

    const messages = document.getElementById('chat-messages');
    const empty    = document.getElementById('chat-empty-state');

    // remove empty state since we have messages to show
    if (empty && empty.parentNode) empty.remove();
    messages.innerHTML = '';

    // render each past message as bubbles
    // message shape: { query, response: { answer, citations }, status }
    const chatHistory = json.data.chat?.messages || [];
    const aiFormatter = window.formatAiResponse || ((text) => `<p>${escapeHtml(text)}</p>`);

    chatHistory.forEach(msg => {
      appendHistoryBubble('user', escapeHtml(msg.query));
      if (msg.response && msg.response.answer) {
        appendHistoryBubble('ai', aiFormatter(msg.response.answer, msg.response.citations));
      }
    });

    // scroll to the bottom of the conversation
    const messagesEl = document.getElementById('chat-messages');
    messagesEl.scrollTop = messagesEl.scrollHeight;

  } catch (err) {
    console.error('[app.js] resumeSession error:', err);
    showToast('Could not load conversation', 'error');
  }
}

// appendHistoryBubble — used when loading past messages into the chat
function appendHistoryBubble(role, htmlContent) {
  const messagesEl = document.getElementById('chat-messages');
  const row = document.createElement('div');
  row.className = 'msg-row ' + role;
  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + role;
  bubble.innerHTML = htmlContent;
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  }

// deleteSession — deletes a chat from the backend and refreshes history
async function deleteSession(chatId) {
  try {
    // DELETE /api/chat/:chatId
    const res = await fetch('/api/chat/' + chatId, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + state.token }
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || 'Delete failed');
    }

    // remove from cache and re-render
    historyCache = historyCache.filter(s => s._id !== chatId);
    renderHistory(historyCache);
    showToast('Conversation deleted');

  } catch (err) {
    showToast('Could not delete conversation', 'error');
    console.error('[app.js] deleteSession error:', err);
  }
}

// formatDate — ISO string to readable AU date
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// formatBytes — bytes to human readable
function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// escapeHtml — prevents HTML injection
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// display login screen when application first loads
showAuthPage('login');