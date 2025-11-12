const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const StudentsEnrollments = require('./studentEnrollments.model');
const TeachingBlocks = require('./teachingBlocks.model');
const TeacherGroups = require('./teacherGroups.model');

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
    assignmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TeacherGroups,
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
    dailyAvarage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    practiceAvarage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    examAvarage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    teachingBlockAvarage: {
        type: DataTypes.DECIMAL(5, 2),
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

TeachingBlockAvarage.belongsTo(TeachingBlocks, {
    foreignKey: 'teachingBlockId',
    as: 'teachingblocks'
});

TeachingBlockAvarage.belongsTo(TeacherGroups, {
    foreignKey: 'assignmentId',
    as: 'teachergroups'
});

module.exports = TeachingBlockAvarage;