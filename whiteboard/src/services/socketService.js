const CoordinationSocketService = (() => {
  let socket = null;
  let currentSessionId = null;
  let currentUserId = null;
  let currentUserName = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 3;

  const connect = ({ url, sessionId, userId, userName, onMessage }) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.warn("WebSocket já está conectado.");
      return;
    }

    currentSessionId = sessionId;
    currentUserId = userId;
    currentUserName = userName;

    try {
      socket = new WebSocket(url);

      socket.onopen = () => {
        console.log("Conectado ao WebSocket");
        reconnectAttempts = 0;

        // Mensagem opcional ao conectar
        sendMessage({
          sessionId: currentSessionId,
          type: "join",
          data: { message: "User joined the session" },
          userId: currentUserId,
          userName: currentUserName,
        });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage && data.userId !== currentUserId) {
            onMessage(data);
          }
        } catch (err) {
          console.error("Erro ao parsear mensagem WebSocket:", err);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket erro:", error);
      };

      socket.onclose = (event) => {
        console.log("WebSocket desconectado:", event.code, event.reason);

        // Tentativa de reconexão
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(
            `Tentando reconectar (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
          );
          setTimeout(
            () => connect({ url, sessionId, userId, userName, onMessage }),
            2000
          );
        }
      };
    } catch (error) {
      console.error("Erro ao criar conexão WebSocket:", error);
    }
  };

  const sendMessage = ({ sessionId, type, data }) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = {
        sessionId: sessionId || currentSessionId,
        type,
        data,
        userId: currentUserId,
        userName: currentUserName,
      };
      socket.send(JSON.stringify(message));
    } else {
      console.warn(
        "WebSocket não está aberto. Não foi possível enviar mensagem."
      );
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
      socket = null;
      currentSessionId = null;
      currentUserId = null;
      currentUserName = null;
      reconnectAttempts = 0;
    }
  };

  return { connect, sendMessage, disconnect };
})();

export default CoordinationSocketService;
