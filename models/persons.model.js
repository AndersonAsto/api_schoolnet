const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');

const Persons = sequelize.define('Persons', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    names: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    lastNames: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    dni: {
        type: DataTypes.CHAR(8),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(9),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(250),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('Administrador', 'Docente', 'Estudiante', 'Apoderado'),
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'persons'
});

module.exports = Persons;