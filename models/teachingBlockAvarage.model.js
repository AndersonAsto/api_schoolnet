const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const StudentsEnrollments = require('./studentsEnrollments.model');
const Schedules = require('./schedules.model');
const TeachingBlocks = require('./teachingBlocks.model');

const TeachingBlockAvarage = sequelize.define('TeachingBlockAvarage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    teachingBlockId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TeachingBlocks,
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
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: StudentsEnrollments,
            key: 'id'
        }
    },
    gradeAvarage: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false
    },
    examAvarage: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false
    },
    teachingblockavarage: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'teachingblockavarage',
    timestamps: true
});

TeachingBlockAvarage.belongsTo(StudentsEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

TeachingBlockAvarage.belongsTo(Schedules, {
    foreignKey: 'scheduleId',
    as: 'schedules'
});

TeachingBlockAvarage.belongsTo(TeachingBlocks, {
    foreignKey: 'teachingBlockId',
    as: 'teachingblocks'
});

module.exports = TeachingBlockAvarage;