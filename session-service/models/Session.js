const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');
const User = require('./User.js'); 

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },  
    SessionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    leaderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Data: {
        type: DataTypes.JSON
    }
}, {
  tableName: 'sessions',
  timestamps: true
});

// Associação 1:N (um usuário pode ser líder de várias sessões)
Session.belongsTo(User, { as: 'id', foreignKey: 'leaderId' });
Session.belongsTo(User, { as: 'id', foreignKey: 'userId' });

module.exports = Session;
