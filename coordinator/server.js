require('dotenv').config();
const express = require('express');
const http = require('http');
require('./ws/wsClient');
const { connectRabbitMQ } = require('./queue/rabbitmqHandler');
const { handleWebSocket } = require('./ws/webSocketHandler');

const app = express();
const server = http.createServer(app);
const PORT = 4000;
(async () => {
  try {
    const channel = await connectRabbitMQ();
    handleWebSocket(server, channel);

    server.listen(PORT, () => {
      console.log(`Servidor de coordenação rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
})();
