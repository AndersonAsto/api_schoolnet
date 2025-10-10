const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Schedules = require('./schedules.model');
const TeachingBlocks = require('./teachingBlocks.model');
const StudentsEnrollments = require('./studentsEnrollments.model');

const Exams =  sequelize.define('Exams', {
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
    teachingBlockId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TeachingBlocks,
            key: 'id'
        }
    },
    score: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false
    },
    maxScore: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Examen', 'Práctica'),
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'exams',
    timestamps: true
});

Exams.belongsTo(StudentsEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

Exams.belongsTo(Schedules, {
    foreignKey: 'scheduleId',
    as: 'schedules'
});

Exams.belongsTo(TeachingBlocks, {
    foreignKey: 'teachingBlockId',
    as: 'teachingblocks'
});

module.exports = Exams;