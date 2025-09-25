const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Grades = sequelize.define('Grades', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    grade: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName:'grades'
});

module.exports = Grades;