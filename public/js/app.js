const state = {
  currentUser: null,
  currentPage: 'login',
  currentSessionId: null,
  token: null,
};

const MOCK_HISTORY = [
  { id: 's1', title: 'Work rights as a student in Australia', date: '2026-05-06', preview: 'Can I work full-time on a student visa?' },
  { id: 's2', title: 'Visa Questions', date: '2026-05-05', preview: 'What is the processing time for a 485 visa?' },
  { id: 's3', title: 'Partner Visa Requirements', date: '2026-05-03', preview: 'What documents are needed for a partner visa?' },
];

function navigateTo(page) {
  document.querySelectorAll('.inner-page').forEach(p => p.classList.add('hidden'));

  document.querySelectorAll('.sb-item[data-page]').forEach(b => b.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  if (target) target.classList.remove('hidden');

  const sbBtn = document.querySelector('.sb-item[data-page="' + page + '"]');
  if (sbBtn) sbBtn.classList.add('active');

  state.currentPage = page;

  if (page === 'home') renderHomeRecent();
  if (page === 'history') renderHistory(MOCK_HISTORY);
}

function showAuthPage(which) {
  document.getElementById('page-login').classList.toggle('hidden', which !== 'login');
  document.getElementById('page-register').classList.toggle('hidden', which !== 'register');
  document.getElementById('app-shell').classList.add('hidden');
}

function enterApp(user, token) {
  state.currentUser = user;
  state.token = token;

  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-register').classList.add('hidden');

  document.getElementById('app-shell').classList.remove('hidden');

  const displayName = user.email.split('@')[0];
  document.getElementById('home-greeting').textContent = 'Hello, ' + displayName + ' 👋';
  document.getElementById('sb-avatar-initials').textContent = displayName.charAt(0).toUpperCase();

  ChatSocket.connect(token);

  navigateTo('home');
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || 'Login failed. Please try again.');
    }

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

document.getElementById('btn-register').addEventListener('click', async () => {
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('register-error');

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
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || 'Registration failed. Please try again.');
    }

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

document.querySelectorAll('.sb-item[data-page]').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.getAttribute('data-page');

    if (page === 'chat') {
      startNewChat();
    } else {
      navigateTo(page);
    }
  });
});

document.querySelectorAll('.qa-card[data-page]').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.getAttribute('data-page')));
});

document.getElementById('btn-attach').addEventListener('click', () => {
  const fileInput = document.getElementById('file-input');

  if (fileInput) {
    fileInput.click();
  }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + state.token }
    });
  } catch (err) {
    console.warn('[logout] API call failed, logging out anyway:', err.message);
  }

  ChatSocket.disconnect();

  state.currentUser = null;
  state.currentSessionId = null;
  state.token = null;

  showAuthPage('login');
  showToast('Signed out successfully');
});

function renderHomeRecent() {
  const list = document.getElementById('home-recent-list');
  const recent = MOCK_HISTORY.slice(0, 3);

  list.innerHTML = recent.map(item => `
    <div class="recent-item" data-id="${item.id}">
      <div class="recent-item-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div class="recent-item-body">
        <p class="recent-title">${item.title}</p>
        <p class="recent-preview">${item.preview}</p>
      </div>
      <span class="recent-date">${formatDate(item.date)}</span>
    </div>
  `).join('');

  list.querySelectorAll('.recent-item').forEach(el => {
    el.addEventListener('click', () => resumeSession(el.dataset.id));
  });
}

document.getElementById('home-new-chat').addEventListener('click', startNewChat);

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

function renderHistory(sessions) {
  const list = document.getElementById('history-list');

  if (!sessions.length) {
    list.innerHTML = '<p class="empty-state">No conversations yet. Start a new chat to begin.</p>';
    return;
  }

  list.innerHTML = sessions.map(item => `
    <div class="history-item" data-id="${item.id}">
      <div class="history-item-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div class="history-item-body">
        <p class="history-conv">${item.title}</p>
        <p class="history-preview">${item.preview}</p>
      </div>
      <span class="history-date">${formatDate(item.date)}</span>
      <div class="history-actions">
        <button class="btn-sm btn-resume" data-id="${item.id}">Resume</button>
        <button class="btn-sm btn-delete" data-id="${item.id}">Delete</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.btn-resume').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      resumeSession(btn.dataset.id);
    });
  });

  list.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteSession(btn.dataset.id);
    });
  });
}

document.getElementById('history-search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();

  const filtered = MOCK_HISTORY.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.preview.toLowerCase().includes(q)
  );

  renderHistory(filtered);
});

document.getElementById('filter-chips').addEventListener('click', e => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;

  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');

  const now = new Date();
  let filtered = MOCK_HISTORY;

  if (chip.dataset.filter === 'week') {
    filtered = MOCK_HISTORY.filter(s => (now - new Date(s.date)) < 7 * 86400000);
  } else if (chip.dataset.filter === 'month') {
    filtered = MOCK_HISTORY.filter(s => (now - new Date(s.date)) < 30 * 86400000);
  }

  renderHistory(filtered);
});

function startNewChat(initialMessage = null) {
  state.currentSessionId = null;

  navigateTo('chat');

  document.getElementById('chat-session-title').textContent = 'New conversation';

  const messages = document.getElementById('chat-messages');

  messages.innerHTML = '';

  const emptyState = document.getElementById('chat-empty-state');

  if (emptyState) {
    messages.appendChild(emptyState);
  }

  if (initialMessage) {
    const input = document.getElementById('chat-input');

    input.value = initialMessage;

    input.dispatchEvent(new Event('input'));

    setTimeout(() => {
      document.getElementById('chat-send-btn').click();
    }, 100);
  }
}

function resumeSession(id) {
  const session = MOCK_HISTORY.find(s => s.id === id);

  if (!session) return;

  state.currentSessionId = id;

  navigateTo('chat');

  document.getElementById('chat-session-title').textContent = session.title;
}

async function deleteSession(id) {
  try {
    const idx = MOCK_HISTORY.findIndex(s => s.id === id);

    if (idx > -1) {
      MOCK_HISTORY.splice(idx, 1);
    }

    renderHistory(MOCK_HISTORY);

    showToast('Conversation deleted');

  } catch (err) {
    showToast('Could not delete conversation', 'error');
    console.error('[deleteSession]', err);
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);

  return d.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

showAuthPage('login');