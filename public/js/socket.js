(function () {

  let socket = null;

  // connect using token from login response 
  function connect(token) {
    if (socket) return;

    socket = io({
      auth: {
        token: token,
      }
    });

    // called once the user logs in successfully
    socket.on('connect', () => {
      console.log('[socket.js] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[socket.js] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[socket.js] Connection error:', err.message);
    });

    socket.on('chat:response', (payload) => {
      if (typeof window._onChatResponse === 'function') {
        window._onChatResponse(payload);
      }
    });
  }

  // called when the user signs out
  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  // called by chat.js whenever the user submits a question.
  function sendMessage(query, sessionId) {
    if (!socket) {
      console.error('[socket.js] Socket not connected');
      return;
    }
    socket.emit('chat:send', { query, sessionId: sessionId || null });
  }

  window.ChatSocket = { connect, disconnect, sendMessage };

})();