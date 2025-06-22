const WebSocket = require("ws");
const { verifyJWT } = require("../utils/jwtUtils");
const axios = require("axios");
const API_BASE_URL = "http://session-service:4010"; 

const clients = new Map();

const handleWebSocket = (server, channel) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    console.log("Nova conexão WebSocket recebida");

    // Extrair token da URL
    const urlParams = new URLSearchParams(req.url.slice(1));
    const token = urlParams.get("token");

    console.log("Token recebido:", token ? "Presente" : "Ausente");

    if (!token) {
      console.log("Conexão fechada: Token não fornecido");
      ws.close(4000, "Token não fornecido");
      return;
    }

    // Validar JWT
    const user = verifyJWT(token);
    console.log("Validação do token:", user ? "Sucesso" : "Falha");

    if (!user) {
      console.log("Conexão fechada: Token inválido");
      ws.close(4001, "Token inválido");
      return;
    }

    ws.userId = user.id; // Salva o userId na conexão
    ws.userName = user.name || user.email || "Usuário"; // Salva o nome do usuário

    let sessionId = null;

    ws.on("message", async (message) => {
      try {
        const parsed = JSON.parse(message);
        const { sessionId: sid, type, data } = parsed;

        // Verifica se o tipo está definido
        if (!type) {
          console.warn("Mensagem recebida sem tipo:", parsed);
          return;
        }

        // Se for a primeira mensagem, registra o sessionId
        if (!sessionId) {
          sessionId = sid;

          try {
            // Adicionar o usuário à sessão via API
            const response = await axios.post(
              `${API_BASE_URL}/session/add-user`,
              { sessionId },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            // Se chegou aqui, a requisição foi bem sucedida
            // Não precisamos fazer nada especial, pois o usuário já está na sessão
            // ou foi adicionado com sucesso
            console.log("Status da conexão:", response.data.status);
          } catch (err) {
            // Só tratamos como erro se for um erro real (não 200)
            if (err.response && err.response.status !== 200) {
              console.error(
                "Erro ao adicionar usuário à sessão via API:",
                err.response?.data || err.message
              );
              ws.send(
                JSON.stringify({
                  type: "error",
                  data: {
                    message: "Falha ao registrar o usuário na sessão.",
                  },
                })
              );
              return;
            }
          }
        }

        // Salvar o WebSocket do usuário
        if (!clients.has(sessionId)) {
          clients.set(sessionId, []);
        }

        if (!clients.get(sessionId).includes(ws)) {
          clients.get(sessionId).push(ws);
        }

        // Enviar evento para RabbitMQ
        const event = {
          sessionId,
          type,
          data,
          userId: user.id,
          userName: ws.userName,
        };

        console.log(
          `Enviando evento para RabbitMQ sessão ${sessionId}:`,
          event
        );

        // Enviar para outros clientes na mesma sessão
        if (clients.has(sessionId)) {
          clients.get(sessionId).forEach((client) => {
            // Não envia para o próprio remetente
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(event));
            }
          });
        }

        // Enviar para RabbitMQ para persistência
        channel.sendToQueue(
          "whiteboard_events",
          Buffer.from(JSON.stringify(event)),
          { persistent: true }
        );
      } catch (e) {
        console.error("Erro ao processar mensagem WebSocket:", e.message);
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: e.message },
            userId: user.id,
          })
        );
      }
    });

    ws.on("close", async () => {
      if (sessionId && clients.has(sessionId)) {
        const updatedClients = clients.get(sessionId).filter((c) => c !== ws);
        if (updatedClients.length > 0) {
          clients.set(sessionId, updatedClients);
        } else {
          clients.delete(sessionId);
        }
      }

      // Remove o usuário da sessão no Redis via API
      if (sessionId) {
        try {
          await axios.post(
            `${API_BASE_URL}/session/remove-user`,
            { sessionId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (err) {
          console.error(
            "Erro ao remover usuário da sessão via API:",
            err.response?.data || err.message
          );
        }
      }
    });
  });

  // Consumir mensagens da fila RabbitMQ
  channel.consume("whiteboard_events", (msg) => {
    if (msg) {
      try {
        const event = JSON.parse(msg.content.toString());
        const { sessionId, type, data, userId, userName } = event;

        if (clients.has(sessionId)) {
          clients.get(sessionId).forEach((ws) => {
            // Não envia para o remetente original
            if (ws.readyState === WebSocket.OPEN && ws.userId !== userId) {
              ws.send(JSON.stringify({ type, data, userId, userName }));
            }
          });
        }

        channel.ack(msg);
      } catch (e) {
        console.error("Erro ao processar evento RabbitMQ:", e.message);
        channel.nack(msg, false, false);
      }
    }
  });
};

module.exports = { handleWebSocket };
