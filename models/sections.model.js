const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Sections = sequelize.define('Sections', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    seccion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'sections'
});

module.exports = Sections;