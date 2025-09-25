const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Persons = require('./persons.model');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const Users = sequelize.define('Users', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    personId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Persons,
            key: 'id'
        }
    },
    userName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('Administrador','Docente','Estudiante','Apoderado'),
        allowNull: false
    },
    chargeDetail: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'users'
});

Users.belongsTo(Persons, {
    foreignKey: 'personId',
    as: 'persons'
});

Users.beforeCreate(async (user, options) => {
    if (user.passwordHash) {
        user.passwordHash = await bcrypt.hash(user.passwordHash, SALT_ROUNDS);
    }
});

Users.beforeUpdate(async (user, options) => {
    if (user.changed('passwordHash')) {
        user.passwordHash = await bcrypt.hash(user.passwordHash, SALT_ROUNDS);
    }
});

module.exports = Users;