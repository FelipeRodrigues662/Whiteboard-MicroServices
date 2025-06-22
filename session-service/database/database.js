const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize({
  host: process.env.MARIADB_HOST,
  dialect: "mariadb",
  username: "root",
  password: "admin",
  database: process.env.MARIADB_DATABASE,
  logging: false,
  retry: {
    max: 5,
    timeout: 10000,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  // Configurações para aumentar limites de tamanho
  dialectOptions: {
    // Aumenta o limite de tamanho de dados
    maxAllowedPacket: 67108864, // 64MB
    // Configurações adicionais para MariaDB
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
});

module.exports = sequelize;
