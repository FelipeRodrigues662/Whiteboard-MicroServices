const { v4: uuidv4 } = require("uuid");
const redis = require("../database/redisClient");
const Session = require("../models/Session.js");
const User = require("../models/User.js");

exports.getSession = async (req, res) => {
  try {
    const data = await redis.get(`session:${req.params.id}`);
    if (!data) return res.status(404).json({ error: "Sessão não encontrada" });

    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Erro ao recuperar a sessão:", error);
    res.status(500).json({ error: "Erro ao recuperar a sessão" });
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
      leaderId,
    });

    try {
      await redis.set(
        `session:${sessionId}`,
        JSON.stringify({ objects: [{ userId }] })
      );
    } catch (error) {
      console.error("Erro ao salvar no Redis:", error);
      return res
        .status(500)
        .json({ error: "Erro ao salvar a sessão no Redis" });
    }

    res.json({ sessionId: session.sessionId });
  } catch (error) {
    console.error("Erro ao salvar a sessão no banco:", error);
    res.status(500).json({ error: "Erro ao salvar a sessão no banco" });
  }
};

exports.addUserToSession = async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.id;

  try {
    // Verificar se já existe uma Session para esse sessionId e userId
    const existingSession = await Session.findOne({
      where: { sessionId, userId },
    });

    // Se não existir, criar uma nova Session para esse usuário
    if (!existingSession) {
      await Session.create({
        sessionId,
        userId,
        leaderId: null, // Sem líder nesse caso
      });
    }

    const redisKey = `session:${sessionId}`;
    const sessionData = await redis.get(redisKey);

    let parsedData = { objects: [] };
    if (sessionData) {
      parsedData = JSON.parse(sessionData);
    }

    // Verificar se o usuário já está no Redis
    const alreadyInRedis = parsedData.objects.some(
      (obj) => obj.userId === userId
    );

    // Se o usuário já estiver no Redis, retornamos sucesso ao invés de erro
    if (alreadyInRedis) {
      return res.json({
        message: "Usuário já está na sessão",
        status: "already_connected",
      });
    }

    // Adicionar o usuário ao Redis
    parsedData.objects.push({ userId });

    await redis.set(redisKey, JSON.stringify(parsedData));

    return res.json({
      message: "Usuário adicionado à sessão com sucesso",
      status: "connected",
    });
  } catch (error) {
    console.error("Erro ao adicionar usuário à sessão:", error);
    res.status(500).json({ error: "Erro ao adicionar usuário à sessão" });
  }
};

exports.removeUserFromSession = async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.id;

  try {
    const redisKey = `session:${sessionId}`;
    const sessionData = await redis.get(redisKey);

    if (!sessionData) {
      return res.status(404).json({ error: "Sessão não encontrada no Redis" });
    }

    let parsedData = JSON.parse(sessionData);

    const before = parsedData.objects.length;
    parsedData.objects = parsedData.objects.filter(
      (obj) => obj.userId !== userId
    );
    const after = parsedData.objects.length;

    if (before === after) {
      return res
        .status(400)
        .json({ error: "Usuário não estava presente na sessão" });
    }

    await redis.set(redisKey, JSON.stringify(parsedData));

    return res.json({ message: "Usuário removido da sessão com sucesso" });
  } catch (error) {
    console.error("Erro ao remover usuário da sessão:", error);
    return res
      .status(500)
      .json({ error: "Erro interno ao remover usuário da sessão" });
  }
};

exports.getActiveSessionsCount = async (req, res) => {
  try {
    // Busca todas as chaves que começam com 'session:'
    const keys = await redis.keys('session:*');
    const count = keys.length;
    res.json({ activeSessions: count });
  } catch (error) {
    console.error('Erro ao contar sessões ativas:', error);
    res.status(500).json({ error: 'Erro ao contar sessões ativas' });
  }
};

exports.getAllConnectedUsers = async (req, res) => {
  try {
    const keys = await redis.keys('session:*');
    let users = [];
    for (const key of keys) {
      const sessionData = await redis.get(key);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.objects && Array.isArray(parsed.objects)) {
          users = users.concat(parsed.objects.map(obj => obj.userId));
        }
      }
    }
    // Remover duplicados
    const uniqueUsers = [...new Set(users)];
    res.json({ connectedUsers: uniqueUsers, count: uniqueUsers.length });
  } catch (error) {
    console.error('Erro ao buscar usuários conectados:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários conectados' });
  }
};

exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar todas as sessões onde o usuário participa
    const sessions = await Session.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'leader',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ sessions });
  } catch (error) {
    console.error("Erro ao buscar sessões do usuário:", error);
    res.status(500).json({ error: "Erro ao buscar sessões do usuário" });
  }
};

exports.getSessionUsers = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Buscar dados da sessão no Redis
    const redisKey = `session:${sessionId}`;
    const sessionData = await redis.get(redisKey);

    if (!sessionData) {
      return res.status(404).json({ error: "Sessão não encontrada no Redis" });
    }

    const parsedData = JSON.parse(sessionData);
    const userIds = parsedData.objects.map(obj => obj.userId);

    if (userIds.length === 0) {
      return res.json({ users: [] });
    }

    // Buscar detalhes dos usuários no banco
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'name', 'email']
    });

    // Buscar informações sobre quem é líder da sessão
    const sessionLeader = await Session.findOne({
      where: { sessionId, leaderId: { [require('sequelize').Op.ne]: null } },
      include: [
        {
          model: User,
          as: 'leader',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    const leaderId = sessionLeader ? sessionLeader.leaderId : null;

    // Adicionar flag de líder para cada usuário
    const usersWithLeaderFlag = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isLeader: user.id === leaderId
    }));

    res.json({ users: usersWithLeaderFlag });
  } catch (error) {
    console.error("Erro ao buscar usuários da sessão:", error);
    res.status(500).json({ error: "Erro ao buscar usuários da sessão" });
  }
};

exports.saveSessionState = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { state } = req.body;
    const userId = req.user.id;

    // Verificar se a sessão existe e se o usuário tem permissão
    const userSession = await Session.findOne({
      where: { sessionId, userId }
    });

    if (!userSession) {
      return res.status(404).json({ error: "Sessão não encontrada ou usuário não tem permissão" });
    }

    // Buscar todas as entradas da tabela Session para esta sessão
    const allSessions = await Session.findAll({
      where: { sessionId }
    });

    if (allSessions.length === 0) {
      return res.status(404).json({ error: "Nenhuma entrada de sessão encontrada" });
    }

    // Atualizar o campo data em todas as entradas da sessão
    const updatePromises = allSessions.map(session => 
      session.update({ data: state })
    );

    await Promise.all(updatePromises);

    res.json({ 
      message: "Estado da sessão salvo com sucesso em todas as entradas",
      sessionId: sessionId,
      updatedEntries: allSessions.length,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error("Erro ao salvar estado da sessão:", error);
    res.status(500).json({ error: "Erro ao salvar estado da sessão" });
  }
};

exports.getSessionState = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verificar se o usuário tem permissão para acessar esta sessão
    const userSession = await Session.findOne({
      where: { sessionId, userId }
    });

    if (!userSession) {
      return res.status(404).json({ error: "Sessão não encontrada ou usuário não tem permissão" });
    }

    // Buscar qualquer entrada da sessão que tenha dados salvos
    const sessionWithData = await Session.findOne({
      where: { 
        sessionId,
        data: { [require('sequelize').Op.ne]: null }
      },
      attributes: ['id', 'sessionId', 'data', 'updatedAt']
    });

    if (!sessionWithData || !sessionWithData.data) {
      return res.status(404).json({ error: "Nenhum estado salvo encontrado para esta sessão" });
    }

    res.json({ 
      sessionId: sessionWithData.sessionId,
      state: sessionWithData.data,
      lastUpdated: sessionWithData.updatedAt
    });

  } catch (error) {
    console.error("Erro ao recuperar estado da sessão:", error);
    res.status(500).json({ error: "Erro ao recuperar estado da sessão" });
  }
};
