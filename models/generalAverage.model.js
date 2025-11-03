const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Years = require('./years.model');
const TeacherGroups = require('./teacherGroups.model');
const StudentsEnrollments = require('./studentsEnrollments.model');

const OverallCourseAverage =  sequelize.define('OverallCourseAverage', {
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
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: StudentsEnrollments,
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
    block1Average: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    block2Average: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    block3Average: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    block4Average: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    courseAverage: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'overallcourseaverage',
    timestamps: true
});

OverallCourseAverage.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
});

OverallCourseAverage.belongsTo(StudentsEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

OverallCourseAverage.belongsTo(TeacherGroups, {
    foreignKey: 'assignmentId',
    as: 'teachergroups'
});

module.exports = OverallCourseAverage;