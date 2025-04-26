const WebSocket = require('ws');
const { verifyJWT } = require('../utils/jwtUtils');

const clients = new Map();

const handleWebSocket = (server, channel) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    let sessionId = null;

    ws.on('message', async (message) => {
      try {
        const parsed = JSON.parse(message);
        const { token, sessionId: sid, data } = parsed;

        verifyJWT(token);
        sessionId = sid;

        if (!clients.has(sessionId)) {
          clients.set(sessionId, []);
        }
        clients.get(sessionId).push(ws);

        const event = { sessionId, data };
        channel.sendToQueue('whiteboard_events', Buffer.from(JSON.stringify(event)), { persistent: true });
      } catch (e) {
        console.error('Erro ao processar mensagem WebSocket:', e.message);
        ws.send(JSON.stringify({ error: e.message }));
      }
    });

    ws.on('close', () => {
      if (sessionId && clients.has(sessionId)) {
        const updated = clients.get(sessionId).filter(c => c !== ws);
        updated.length ? clients.set(sessionId, updated) : clients.delete(sessionId);
      }
    });
  });

  // Consumidor RabbitMQ
  channel.consume('whiteboard_events', (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      const { sessionId, data } = event;

      if (clients.has(sessionId)) {
        clients.get(sessionId).forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
          }
        });
      }

      channel.ack(msg);
    }
  });
};

module.exports = { handleWebSocket };
