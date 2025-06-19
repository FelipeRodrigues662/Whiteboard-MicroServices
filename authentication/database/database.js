const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.MARIADB_HOST,          
  dialect: 'mariadb',
  username: 'root',       
  password: 'admin',
  database: process.env.MARIADB_DATABASE,    
  logging: false,
  retry: {
    max: 5,
    timeout: 10000
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
