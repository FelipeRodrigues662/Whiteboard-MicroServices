const express = require('express');
const router = express.Router();
const { createSession, getSession, addUserToSession, removeUserFromSession, getActiveSessionsCount, getAllConnectedUsers } = require('../controllers/sessionController');
const authenticateToken = require('../middleware/auth.js');


/**
 * @swagger
 * /create-session:
 *   post:
 *     summary: Cria uma nova sessão
 *     responses:
 *       200:
 *         description: Sessão criada com sucesso
 */
router.post('/create-session', authenticateToken, createSession);

/**
 * @swagger
 * /session/{id}:
 *   get:
 *     summary: Recupera estado de uma sessão
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado da sessão
 */
router.get('/session/:id', authenticateToken, getSession);

/**
 * @swagger
 * /session/add-user:
 *   post:
 *     summary: Adiciona um usuário a uma sessão
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário adicionado com sucesso
 *       400:
 *         description: Usuário já está na sessão
 *       404:
 *         description: Sessão não encontrada
 */
router.post('/session/add-user', authenticateToken, addUserToSession);

/**
 * @swagger
 * /session/remove-user:
 *   post:
 *     summary: Remove um usuário de uma sessão
 *     description: Remove o usuário autenticado da lista de participantes da sessão no Redis.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId    
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: ID da sessão da qual o usuário será removido
 *     responses:
 *       200:
 *         description: Usuário removido da sessão com sucesso
 *       400:
 *         description: Usuário não estava presente na sessão
 *       404:
 *         description: Sessão não encontrada no Redis
 *       500:
 *         description: Erro interno ao remover usuário da sessão
 */
router.post('/session/remove-user', authenticateToken, removeUserFromSession);

/**
 * @swagger
 * /sessions/active-count:
 *   get:
 *     summary: Recupera a quantidade de sessões ativas
 *     responses:
 *       200:
 *         description: Quantidade de sessões ativas
 */
router.get('/sessions/active-count', getActiveSessionsCount);

/**
 * @swagger
 * /sessions/connected-users:
 *   get:
 *     summary: Recupera usuários conectados em todas as sessões
 *     responses:
 *       200:
 *         description: Usuários conectados em todas as sessões
 */
router.get('/sessions/connected-users', getAllConnectedUsers);

module.exports = router;
