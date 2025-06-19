const amqp = require('amqplib');

const connectRabbitMQ = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Tentativa ${i + 1} de conectar ao RabbitMQ...`);
      
      const connection = await amqp.connect({
        protocol: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'localhost',
        port: 5672,
        username: process.env.RABBITMQ_USER || 'user',
        password: process.env.RABBITMQ_PASSWORD || 'pass'
      });

      const channel = await connection.createChannel();
      await channel.assertQueue('whiteboard_events', { durable: true });

      console.log('✓ Conectado ao RabbitMQ com sucesso!');
      return channel;
    } catch (error) {
      console.error(`Erro na tentativa ${i + 1}:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      console.log(`Aguardando ${delay/1000} segundos antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = { connectRabbitMQ };
