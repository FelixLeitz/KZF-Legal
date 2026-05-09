(function () {

  let socket = null;

  function connect(token) {
    if (socket) return;

    socket = io({
      auth: {
        token: token,
      }
    });

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

  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  function sendMessage(query, sessionId) {

    if (!socket) {
      console.error('[socket.js] Cannot send — socket not connected. Was connect() called after login?');
      return;
    }

    socket.emit('chat:send', {
      query:     query,
      sessionId: sessionId || null,
    });
  }

  window.ChatSocket = {
    connect,
    disconnect,
    sendMessage,
  };

})();