const WebSocket = require('ws');
const { verifyJWT } = require('../utils/jwtUtils'); 
const axios = require('axios');
const API_BASE_URL = 'http://localhost:4010';

const clients = new Map();

const handleWebSocket = (server, channel) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.slice(1));
    const token = urlParams.get('token');

    if (!token) {
      ws.close(4000, 'Token não fornecido');
      return;
    }

    let sessionId = null;

    ws.on('message', async (message) => {
      try {
        const parsed = JSON.parse(message);
        const { sessionId: sid, data } = parsed;

        // Armazena o sessionId
        if (!sessionId) {
          sessionId = sid;

          // Adiciona usuário à sessão via API
          try {
            await axios.post(`${API_BASE_URL}/session/add-user`, { sessionId }, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
          } catch (err) {
            console.error('Erro ao adicionar usuário à sessão via API:', err.response?.data || err.message);
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Falha ao registrar o usuário na sessão.' } }));
            return;
          }
        }

        // Armazena o WebSocket do usuário
        if (!clients.has(sessionId)) {
          clients.set(sessionId, []);
        }

        if (!clients.get(sessionId).includes(ws)) {
          clients.get(sessionId).push(ws);
        }

        const event = { sessionId, data };
        console.log(`Enviando evento para a fila RabbitMQ para a sessão ${sessionId}: ${JSON.stringify(event)}`);
        channel.sendToQueue('whiteboard_events', Buffer.from(JSON.stringify(event)), { persistent: true });

      } catch (e) {
        console.error('Erro ao processar mensagem WebSocket:', e.message);
        ws.send(JSON.stringify({ type: 'error', payload: { message: e.message } }));
      }
    });

    ws.on('close', async () => {
      if (sessionId && clients.has(sessionId)) {
        const updated = clients.get(sessionId).filter(c => c !== ws);
        if (updated.length) {
          clients.set(sessionId, updated);
        } else {
          clients.delete(sessionId);
        }
      }

      // Remove o usuário da sessão no Redis via API
      if (sessionId) {
        try {
          await axios.post(`${API_BASE_URL}/session/remove-user`, { sessionId }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        } catch (err) {
          console.error('Erro ao remover usuário da sessão via API:', err.response?.data || err.message);
        }
      }
    });

  });

  channel.consume('whiteboard_events', (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      const { sessionId, data } = event;

      if (clients.has(sessionId)) {
        clients.get(sessionId).forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              console.log(`Enviando para o WebSocket da sessão ${sessionId} com dados: ${JSON.stringify(data)}`);
              ws.send(JSON.stringify({
                  type,
                  data
                }));
            } catch (e) {
              console.error('Erro ao enviar mensagem para o WebSocket:', e.message);
            }
          } else {
            clients.set(sessionId, clients.get(sessionId).filter(client => client !== ws));
          }
        });
      }

      channel.ack(msg);
    }
  });
};

module.exports = { handleWebSocket };
