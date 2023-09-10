const { Sequelize, DataTypes, Model } = require('sequelize');

// Initialize sequelize with SQLite database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

// Define User model
class User extends Model { }

User.init({
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    chatId: { type: DataTypes.STRING, allowNull: false, unique: true },
    skills: DataTypes.STRING,
    preferences: DataTypes.STRING,
}, {
    sequelize,
    modelName: 'User'
});

sequelize.sync();

module.exports = {
    User,
    sequelize
};
