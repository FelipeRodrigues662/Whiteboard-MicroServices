const express = require('express');
const router = express.Router();
const { createSession, getSession } = require('../controllers/sessionController');

/**
 * @swagger
 * /create-session:
 *   post:
 *     summary: Cria uma nova sessão
 *     responses:
 *       200:
 *         description: Sessão criada com sucesso
 */
router.post('/create-session', createSession);

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
router.get('/session/:id', getSession);

module.exports = router;
