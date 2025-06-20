const express = require('express');
const router = express.Router();
const { createSession, getSession, addUserToSession, removeUserFromSession, getActiveSessionsCount, getAllConnectedUsers, getUserSessions, getSessionUsers, saveSessionState, getSessionState } = require('../controllers/sessionController');
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

/**
 * @swagger
 * /user/sessions:
 *   get:
 *     summary: Recupera todas as sessões do usuário autenticado
 *     description: Retorna todas as sessões onde o usuário do token participa, com dados da tabela session
 *     responses:
 *       200:
 *         description: Lista de sessões do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       sessionId:
 *                         type: string
 *                       userId:
 *                         type: integer
 *                       leaderId:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                       leader:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/user/sessions', authenticateToken, getUserSessions);

/**
 * @swagger
 * /session/{sessionId}/users:
 *   get:
 *     summary: Recupera detalhes dos usuários de uma sessão
 *     description: Busca no Redis os userIds da sessão e retorna os detalhes completos dos usuários do banco
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sessão
 *     responses:
 *       200:
 *         description: Lista de usuários da sessão com detalhes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: ID do usuário
 *                       name:
 *                         type: string
 *                         description: Nome do usuário
 *                       email:
 *                         type: string
 *                         description: Email do usuário
 *                       isLeader:
 *                         type: boolean
 *                         description: Se o usuário é líder da sessão
 *       404:
 *         description: Sessão não encontrada no Redis
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/session/:sessionId/users', authenticateToken, getSessionUsers);

/**
 * @swagger
 * /session/{sessionId}/state:
 *   post:
 *     summary: Salva o estado da sessão no banco de dados
 *     description: Salva o estado atual da sessão no campo data da tabela Session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sessão
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - state
 *             properties:
 *               state:
 *                 type: object
 *                 description: Estado da sessão a ser salvo (pode ser qualquer objeto JSON)
 *                 example: {
 *                   "canvas": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
 *                   "objects": [{"type": "rect", "x": 100, "y": 100}],
 *                   "version": "1.0"
 *                 }
 *     responses:
 *       200:
 *         description: Estado da sessão salvo com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Estado da sessão salvo com sucesso"
 *                 sessionId:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Sessão não encontrada ou usuário não tem permissão
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/session/:sessionId/state', authenticateToken, saveSessionState);

/**
 * @swagger
 * /session/{sessionId}/state:
 *   get:
 *     summary: Recupera o estado salvo da sessão
 *     description: Busca o estado salvo no campo data da tabela Session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sessão
 *     responses:
 *       200:
 *         description: Estado da sessão recuperado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 state:
 *                   type: object
 *                   description: Estado salvo da sessão (pode ser qualquer objeto JSON)
 *                   example: {
 *                     "canvas": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
 *                     "objects": [{"type": "rect", "x": 100, "y": 100}],
 *                     "version": "1.0"
 *                   }
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Sessão não encontrada ou usuário não tem permissão
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/session/:sessionId/state', authenticateToken, getSessionState);

module.exports = router;
