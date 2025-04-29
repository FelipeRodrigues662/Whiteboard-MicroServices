const CoordinationSocketService = (() => {
  let socket = null;

  const connect = ({ url, token, sessionId, onMessage }) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.warn('WebSocket já está conectado.');
      return;
    }

    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('Conectado ao servidor WebSocket');
      socket.send(JSON.stringify({ token, sessionId, data: { type: 'join' } }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    };

    socket.onclose = () => {
      console.log('WebSocket desconectado.');
    };
  };

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const disconnect = () => {
    if (socket) socket.close();
  };

  return { connect, sendMessage, disconnect };
})();

export default CoordinationSocketService;
