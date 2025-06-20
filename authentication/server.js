require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const sequelize = require('./database/database.js');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Função para testar a conexão com o banco
const testDatabaseConnection = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Tentativa ${i + 1} de conectar ao banco de dados...`);
      await sequelize.authenticate();
      console.log('✓ Conexão com o banco de dados estabelecida!');
      return;
    } catch (error) {
      console.error(`Erro na tentativa ${i + 1}:`, error.message);
      
      if (i === retries - 1) {
        console.error('Falha ao conectar ao banco após todas as tentativas');
        throw error;
      }
      
      console.log(`Aguardando ${delay/1000} segundos antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Inicializar o servidor com retry
const startServer = async () => {
  try {
    await testDatabaseConnection();
    
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.use(authRoutes);

    const PORT = 4020;
    app.listen(PORT, () => console.log(`Authentication service rodando na porta ${PORT}`));
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

startServer();
