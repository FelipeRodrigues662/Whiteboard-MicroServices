const { DataTypes } = require("sequelize");
const sequelize = require("../database/database.js");
const User = require("./User.js");

const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    leaderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
    },
  },
  {
    tableName: "sessions",
    timestamps: true,
  }
);

// Associação: Cada sessão pertence a um líder (user) e um usuário
Session.belongsTo(User, { as: "leader", foreignKey: "leaderId" });
Session.belongsTo(User, { as: "user", foreignKey: "userId" });

module.exports = Session;
