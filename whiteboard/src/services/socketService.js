const CoordinationSocketService = (() => {
  let socket = null;
  let currentSessionId = null;

  const connect = ({ url, token, sessionId, onMessage }) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.warn('WebSocket já está conectado.');
      return;
    }

    currentSessionId = sessionId;

    // Inclui o token como query param
    const wsUrl = ${url}?token=${token};
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Conectado ao WebSocket');

      // Opcional: enviar uma mensagem inicial se quiser
      sendMessage({
        sessionId: currentSessionId,
        type: 'join',
        data: { message: 'User joined the session' }
      });
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (err) {
        console.error('Erro ao parsear mensagem WebSocket:', err);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket erro:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket desconectado.');
    };
  };

  const sendMessage = ({ sessionId, type, data }) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = {
        sessionId: sessionId || currentSessionId,
        type,
        data
      };
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket não está aberto. Não foi possível enviar mensagem.');
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
      socket = null;
      currentSessionId = null;
    }
  };

  return { connect, sendMessage, disconnect };
})();

export default CoordinationSocketService;
