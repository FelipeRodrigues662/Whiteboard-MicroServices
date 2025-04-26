const { v4: uuidv4 } = require('uuid');
const redis = require('../database/redisClient');

exports.createSession = async (req, res) => {
  const sessionId = uuidv4();
  try {
    await redis.set(`session:${sessionId}`, JSON.stringify({ objects: [] }));
    res.json({ sessionId });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar a sessão' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const data = await redis.get(`session:${req.params.id}`);
    if (!data) return res.status(404).json({ error: 'Sessão não encontrada' });
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao recuperar a sessão' });
  }
};
