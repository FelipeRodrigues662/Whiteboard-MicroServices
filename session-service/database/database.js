const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.MARIADB_HOST,          
  dialect: 'mariadb',
  username: 'root',       
  password: 'admin',
  database: process.env.MARIADB_DATABASE,    
  logging: false
});

module.exports = sequelize;
