const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Years = require('./years.model');

const SchoolDays = sequelize.define('SchoolDays', {
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
    teachingDay: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    weekday: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    weekNumber: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'schooldays',
    timestamps: true
});

SchoolDays.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
})

module.exports = SchoolDays;