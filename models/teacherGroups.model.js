const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const TeacherAssignments = require('./teacherAssignments.model');
const Years = require('./years.model');
const Grades = require('./grades.model');
const Sections = require('./sections.model');
const Courses = require('./courses.model');

const TeacherGroups = sequelize.define('TeacherGroups', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    teacherAssignmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TeacherAssignments,
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
    gradeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Grades,
            key: 'id'
        }
    },
    sectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Sections,
            key: 'id'
        }
    },
    courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Courses,
            key: 'id'
        }
    }
}, {
    tableName: 'teachergroups',
    timestamps: true
});

TeacherGroups.belongsTo(TeacherAssignments, {
    foreignKey: 'teacherAssignmentId',
    as: 'teacherassignments'
});

TeacherGroups.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
});

TeacherGroups.belongsTo(Grades, {
    foreignKey: 'gradeId',
    as: 'grades'
});

TeacherGroups.belongsTo(Sections, {
    foreignKey: 'sectionId',
    as: 'sections'
});

TeacherGroups.belongsTo(Courses, {
    foreignKey: 'courseId',
    as: 'courses'
});

module.exports = TeacherGroups;