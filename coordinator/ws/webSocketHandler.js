const WebSocket = require('ws');
const { verifyJWT } = require('../utils/jwtUtils');
const axios = require('axios');
const API_BASE_URL = 'http://localhost:4010';

const clients = new Map();

const handleWebSocket = (server, channel) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    // Extrair token da URL
    const url = new URL(req.url, http://${req.headers.host});
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4000, 'Token não fornecido');
      return;
    }

    // Validar JWT
    const user = verifyJWT(token);
    if (!user) {
      ws.close(4001, 'Token inválido');
      return;
    }

    let sessionId = null;

    ws.on('message', async (message) => {
      try {
        const parsed = JSON.parse(message);
        const { sessionId: sid, data } = parsed;

        // Se for a primeira mensagem, registra o sessionId
        if (!sessionId) {
          sessionId = sid;

          try {
            // Adicionar o usuário na sessão via API
            await axios.post(${API_BASE_URL}/session/add-user, { sessionId }, {
              headers: {
                Authorization: Bearer ${token}
              }
            });
          } catch (err) {
            console.error('Erro ao adicionar usuário à sessão via API:', err.response?.data || err.message);
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Falha ao registrar o usuário na sessão.' } }));
            return;
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
          type: 'user-event',  // Aqui você pode ajustar o tipo de evento conforme desejar
          data
        };

        console.log(Enviando evento para RabbitMQ sessão ${sessionId}:, event);

        channel.sendToQueue('whiteboard_events', Buffer.from(JSON.stringify(event)), { persistent: true });

      } catch (e) {
        console.error('Erro ao processar mensagem WebSocket:', e.message);
        ws.send(JSON.stringify({ type: 'error', payload: { message: e.message } }));
      }
    });

    ws.on('close', async () => {
      if (sessionId && clients.has(sessionId)) {
        const updatedClients = clients.get(sessionId).filter(c => c !== ws);
        if (updatedClients.length > 0) {
          clients.set(sessionId, updatedClients);
        } else {
          clients.delete(sessionId);
        }
      }

      // Remove o usuário da sessão no Redis via API
      if (sessionId) {
        try {
          await axios.post(${API_BASE_URL}/session/remove-user, { sessionId }, {
            headers: {
              Authorization: Bearer ${token}
            }
          });
        } catch (err) {
          console.error('Erro ao remover usuário da sessão via API:', err.response?.data || err.message);
        }
      }
    });
  });

  // Consumir mensagens da fila RabbitMQ
  channel.consume('whiteboard_events', (msg) => {
    if (msg) {
      try {
        const event = JSON.parse(msg.content.toString());
        const { sessionId, type, data } = event;

        if (clients.has(sessionId)) {
          clients.get(sessionId).forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type, data }));
            } else {
              // Remover conexões mortas
              const updated = clients.get(sessionId).filter(client => client.readyState === WebSocket.OPEN);
              clients.set(sessionId, updated);
            }
          });
        }

        channel.ack(msg);

      } catch (e) {
        console.error('Erro ao processar evento RabbitMQ:', e.message);
        channel.nack(msg, false, false); // Rejeita a mensagem, sem reencaminhar
      }
    }
  });
};

module.exports = { handleWebSocket };
