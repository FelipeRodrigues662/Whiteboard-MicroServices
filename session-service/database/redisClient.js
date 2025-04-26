const Redis = require('ioredis');

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost' });

module.exports = redis;
