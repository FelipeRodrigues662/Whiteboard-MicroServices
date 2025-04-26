const amqp = require('amqplib');

const connectRabbitMQ = async () => {
  const connection = await amqp.connect({
    protocol: 'amqp',
    hostname: process.env.RABBITMQ_HOST || 'localhost',
    port: 5672,
    username: process.env.RABBITMQ_USER || 'user',
    password: process.env.RABBITMQ_PASSWORD || 'pass'
  });

  const channel = await connection.createChannel();
  await channel.assertQueue('whiteboard_events', { durable: true });

  return channel;
};

module.exports = { connectRabbitMQ };
