require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const sequelize = require('./database/database.js');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();

app.use(cors());
app.use(express.json());
sequelize.sync({ alter : true });

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(authRoutes);
app.use(sessionRoutes);

const PORT = 4000;
app.listen(PORT, () => console.log(`Session service rodando na porta ${PORT}`));
