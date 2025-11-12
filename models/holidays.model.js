const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const Years = require('./years.model');

const Holidays = sequelize.define('Holidays', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    yearId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Years,
            key: 'id'
        }
    },
    holiday: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'holidays',
    timestamps: true
});

Holidays.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
})

module.exports = Holidays;