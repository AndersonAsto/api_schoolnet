const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const TeachingBlocks = require('./teachingBlocks.model');
const StudentsEnrollments = require('./studentEnrollments.model');
const TeacherGroups = require('./teacherGroups.model');

const Exams = sequelize.define('Exams', {
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
    assigmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TeacherGroups,
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
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    examDate: {
        type: DataTypes.DATE,
        allowNull: true
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

Exams.belongsTo(TeacherGroups, {
    foreignKey: 'assigmentId',
    as: 'assignments'
});

Exams.belongsTo(TeachingBlocks, {
    foreignKey: 'teachingBlockId',
    as: 'teachingblocks'
});

module.exports = Exams;