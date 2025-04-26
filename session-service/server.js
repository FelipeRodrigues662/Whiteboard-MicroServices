require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
app.use(express.json());

// Documentação Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas
app.use(authRoutes);
app.use(sessionRoutes);

// Inicialização do servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Session service rodando na porta ${PORT}`));
