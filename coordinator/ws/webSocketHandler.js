const WebSocket = require('ws');
const { verifyJWT } = require('../utils/jwtUtils'); // Função para verificar o JWT

const clients = new Map();

const handleWebSocket = (server, channel) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    // Obtém o token da URL da requisição
    const urlParams = new URLSearchParams(req.url.slice(1)); 
    const token = urlParams.get('token');  

    if (!token) {
      ws.close(4000, 'Token não fornecido');
      return;
    }

    try {
      // Verifica o token
      verifyJWT(token);

      let sessionId = null;

      // Ao receber mensagem
      ws.on('message', async (message) => {
        try {
          const parsed = JSON.parse(message);
          const { sessionId: sid, data } = parsed;
          sessionId = sid;

          // Garante que a lista de clientes da sessão está inicializada
          if (!clients.has(sessionId)) {
            clients.set(sessionId, []);
          }

          // Adiciona o WebSocket à lista de clientes da sessão
          clients.get(sessionId).push(ws);

          // Envia o evento de desenho para a fila RabbitMQ
          const event = { sessionId, data };
          channel.sendToQueue('whiteboard_events', Buffer.from(JSON.stringify(event)), { persistent: true });
        } catch (e) {
          console.error('Erro ao processar mensagem WebSocket:', e.message);
          ws.send(JSON.stringify({ error: e.message }));
        }
      });

      // Ao fechar a conexão
      ws.on('close', () => {
        if (sessionId && clients.has(sessionId)) {
          // Remove o WebSocket desconectado da lista de clientes da sessão
          const updated = clients.get(sessionId).filter(c => c !== ws);
          if (updated.length) {
            clients.set(sessionId, updated);
          } else {
            clients.delete(sessionId);
          }
        }
      });

    } catch (e) {
      console.error('Token inválido ou expirado:', e.message);
      ws.close(4001, 'Token inválido ou expirado');
    }
  });

  // Consumidor RabbitMQ para processar eventos de desenho
  channel.consume('whiteboard_events', (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      const { sessionId, data } = event;

      // Broadcast do evento de desenho para todos os clientes da mesma sessão
      if (clients.has(sessionId)) {
        clients.get(sessionId).forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify(data));  // Envia os dados de desenho (linha)
            } catch (e) {
              console.error('Erro ao enviar mensagem para o WebSocket:', e.message);
            }
          } else {
            // Se o WebSocket não está aberto, remove da lista de clientes
            clients.set(sessionId, clients.get(sessionId).filter(client => client !== ws));
          }
        });
      }

      // Confirma que a mensagem foi processada na fila RabbitMQ
      channel.ack(msg);
    }
  });
};

module.exports = { handleWebSocket };
