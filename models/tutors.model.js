const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const TeacherAssignments = require("./teacherAssignments.model");
const Grades = require('./grades.model');
const Sections = require('./sections.model');

const Tutors = sequelize.define('Tutors', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TeacherAssignments,
            key: 'id'
        }
    },
    gradeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Grades,
            key: 'id',
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
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'tutorteachers',
    timestamps: true,
});

Tutors.belongsTo(TeacherAssignments, {
    foreignKey: 'teacherId',
    as: 'teachers',
    onDelete: 'CASCADE'
})

Tutors.belongsTo(Grades, {
    foreignKey: 'gradeId',
    as: 'grades',
    onDelete: 'CASCADE'
})

Tutors.belongsTo(Sections, {
    foreignKey: 'sectionId',
    as: 'sections',
    onDelete: 'CASCADE'
})

module.exports = Tutors;