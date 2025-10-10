const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Years = require('./years.model');
const StudentsEnrollments = require('./studentsEnrollments.model');
const Schedules = require('./schedules.model');

const GeneralAvarage =  sequelize.define('GeneralAvarage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: StudentsEnrollments,
            key: 'id'
        }
    },
    scheduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Schedules,
            key: 'id'
        }
    },
    yearId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Years,
            key: 'id'
        }
    },
    block1Avarage: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    block2Avarage: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    block3Avarage: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    block4Avarage: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    annualAvarage: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'ganeralavarage',
    timestamps: true
});

GeneralAvarage.belongsTo(StudentsEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

GeneralAvarage.belongsTo(Schedules, {
    foreignKey: 'scheduleId',
    as: 'schedules'
});

GeneralAvarage.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
});

module.exports = GeneralAvarage;