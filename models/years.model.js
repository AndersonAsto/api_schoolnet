const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Years = sequelize.define ('Years', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'years',
    timestamps: true
});

module.exports = Years;