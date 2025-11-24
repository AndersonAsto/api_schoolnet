const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const TeachingBlocks = require('./teachingBlocks.model');
const StudentEnrollments = require('./studentEnrollments.model');
const TeacherGroups = require('./teacherGroups.model');

const Evaluations = sequelize.define('Evaluations', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: StudentEnrollments,
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

Evaluations.belongsTo(StudentEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

Evaluations.belongsTo(TeacherGroups, {
    foreignKey: 'assigmentId',
    as: 'assignments'
});

Evaluations.belongsTo(TeachingBlocks, {
    foreignKey: 'teachingBlockId',
    as: 'teachingblocks'
});

module.exports = Evaluations;