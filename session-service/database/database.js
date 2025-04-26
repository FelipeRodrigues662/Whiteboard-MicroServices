const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.MARIADB_HOST,
  dialect: 'mariadb',
  username: process.env.MARIADB_USER,
  password: process.env.MARIADB_ROOT_PASSWORD,
  database: process.env.MARIADB_DATABASE,
  logging: false
});

module.exports = sequelize;