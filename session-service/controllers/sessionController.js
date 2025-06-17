const { v4: uuidv4 } = require('uuid');
const redis = require('../database/redisClient');
const Session = require('../models/Session.js');

exports.getSession = async (req, res) => {
  try {
    const data = await redis.get(`session:${req.params.id}`);
    if (!data) return res.status(404).json({ error: 'Sessão não encontrada' });

    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Erro ao recuperar a sessão:', error);
    res.status(500).json({ error: 'Erro ao recuperar a sessão' });
  }
};

exports.createSession = async (req, res) => {
  const sessionId = uuidv4();
  const leaderId = req.user.id;
  const userId = req.user.id;

  try {
    const session = await Session.create({
      sessionId,
      userId,
      leaderId
    });

    try {
      await redis.set(`session:${sessionId}`, JSON.stringify({ objects: [{ userId }] }));
    } catch (error) {
      console.error('Erro ao salvar no Redis:', error);
      return res.status(500).json({ error: 'Erro ao salvar a sessão no Redis' });
    }

    res.json({ sessionId: session.sessionId });
  } catch (error) {
    console.error('Erro ao salvar a sessão no banco:', error);
    res.status(500).json({ error: 'Erro ao salvar a sessão no banco' });
  }
};

exports.addUserToSession = async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.id;

  try {
    // Verificar se já existe uma Session para esse sessionId e userId
    const existingSession = await Session.findOne({
      where: { sessionId, userId }
    });

    // Se não existir, criar uma nova Session para esse usuário
    if (!existingSession) {
      await Session.create({
        sessionId,
        userId,
        leaderId: null  // Sem líder nesse caso
      });
    }

    const redisKey = `session:${sessionId}`;
    const sessionData = await redis.get(redisKey);

    let parsedData = { objects: [] };
    if (sessionData) {
      parsedData = JSON.parse(sessionData);
    }

    // Verificar se o usuário já está no Redis
    const alreadyInRedis = parsedData.objects.some(obj => obj.userId === userId);
    if (alreadyInRedis) {
      return res.status(400).json({ error: 'Usuário já está na sessão' });
    }

    // Adicionar o usuário ao Redis
    parsedData.objects.push({ userId });

    await redis.set(redisKey, JSON.stringify(parsedData));

    return res.json({ message: 'Usuário adicionado à sessão com sucesso' });

  } catch (error) {
    console.error('Erro ao adicionar usuário à sessão:', error);
    res.status(500).json({ error: 'Erro ao adicionar usuário à sessão' });
  }
};

exports.removeUserFromSession = async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.id;

  try {
    const redisKey = `session:${sessionId}`;
    const sessionData = await redis.get(redisKey);

    if (!sessionData) {
      return res.status(404).json({ error: 'Sessão não encontrada no Redis' });
    }

    let parsedData = JSON.parse(sessionData);

    const before = parsedData.objects.length;
    parsedData.objects = parsedData.objects.filter(obj => obj.userId !== userId);
    const after = parsedData.objects.length;

    if (before === after) {
      return res.status(400).json({ error: 'Usuário não estava presente na sessão' });
    }

    await redis.set(redisKey, JSON.stringify(parsedData));

    return res.json({ message: 'Usuário removido da sessão com sucesso' });

  } catch (error) {
    console.error('Erro ao remover usuário da sessão:', error);
    return res.status(500).json({ error: 'Erro interno ao remover usuário da sessão' });
  }
};
