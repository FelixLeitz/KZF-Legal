// socket.js file 
// responsibilities: establishes a Socket.IO connection between FE and BE
// authenticates the socket connection using a user token
// updates the chat UI in real-time based on incoming messages and events from the backend
// listens for chat related events

(function () {
  // stores the active socket connection  
  let socket = null;

  // creates a new socket connection
  function connect(token) {

    // prevent multiple socket connections
    if (socket) return;

    // initialise socket.io connection and sends authentication token to backend
    socket = io({
      auth: { token }
    });

    // runs when connection to backend succeeds
    socket.on('connect', () => {
      console.log('[socket.js] Connected:', socket.id);
    });

    // runs when socket disconnects
    socket.on('disconnect', (reason) => {
      console.warn('[socket.js] Disconnected:', reason);
    });

    // runs if connection fails or authentication fails
    socket.on('connect_error', (err) => {
      console.error('[socket.js] Connection error:', err.message);
    });

    // chat success event: receives successful chat response from backend, check if frontend update handler exists, and sends response data to frontend for UI update
    socket.on('chat:response', (payload) => {
      if (typeof window._onChatUpdated === 'function') {
        window._onChatUpdated({
          messageId: payload.messageId,
          status: 'completed',
          response: {
            answer: payload.answer,
            citations: payload.citations || []
          }
        });
      }
    });

    // chat error event: receives failed chat response from backend, check if frontend update handler exists and sends error message if none provided
    socket.on('chat:error', (payload) => {
      if (typeof window._onChatUpdated === 'function') {
        window._onChatUpdated({
          messageId: payload.messageId,
          status: 'failed',
          error: {
            message: payload.message || 'Something went wrong'
          }
        });
      }
    });

    // document update event: listens for backend document changes, check if document update handler exists and send updated document data to frontend
    socket.on('document:updated', (payload) => {
      if (typeof window._onDocumentUpdated === 'function') {
        window._onDocumentUpdated(payload);
      }
    });
  }
  
  // safely disconnects the active socket connection but only disconnect if socket exists
  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  // expose public socket methods globally
  window.ChatSocket = { connect, disconnect };

})();