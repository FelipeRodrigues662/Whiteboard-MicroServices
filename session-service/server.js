require("dotenv").config();
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const sequelize = require("./database/database.js");
const cors = require("cors");
const sessionRoutes = require("./routes/sessionRoutes");

const app = express();
const PORT = 4010;
app.use(cors());

// Configuração do body-parser com limite aumentado para suportar imagens base64
app.use(
  express.json({
    limit: "50mb", // Aumenta o limite para 50MB
  })
);
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

// Configuração de timeout para requisições grandes
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutos
  res.setTimeout(300000); // 5 minutos
  next();
});

// Função para sincronizar o banco com retry
const syncDatabase = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Tentativa ${i + 1} de sincronizar o banco de dados...`);
      await sequelize.sync({ alter: true });
      console.log("✓ Banco de dados sincronizado com sucesso!");
      return;
    } catch (error) {
      console.error(`Erro na tentativa ${i + 1}:`, error.message);

      if (i === retries - 1) {
        console.error("Falha ao sincronizar o banco após todas as tentativas");
        throw error;
      }

      console.log(
        `Aguardando ${delay / 1000} segundos antes da próxima tentativa...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Inicializar o servidor com retry
const startServer = async () => {
  try {
    await syncDatabase();

    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.use(sessionRoutes);

    app.listen(PORT, () =>
      console.log(`Session service rodando na porta ${PORT}`)
    );
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
};

startServer();
