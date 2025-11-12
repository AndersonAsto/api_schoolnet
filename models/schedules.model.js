const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const Years = require('./years.model');
const Users = require('./users.model');
const TeacherAssignments = require('./teacherAssignments.model');
const Courses = require('./courses.model');
const Grades = require('./grades.model');
const Sections = require('./sections.model');

const Schedules = sequelize.define('Schedules', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    yearId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Years,
            key: 'id'
        }
    },
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TeacherAssignments,
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
    weekday: {
        type: DataTypes.ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'),
        allowNull: false,
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    timestamps: true,
    tableName: 'schedules'
});

Schedules.belongsTo(TeacherAssignments, {
    foreignKey: 'teacherId',
    as: 'teachers'
});

Schedules.belongsTo(Courses, {
    foreignKey: 'courseId',
    as: 'courses'
})

Schedules.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
});

Schedules.belongsTo(Grades, {
    foreignKey: 'gradeId',
    as: 'grades'
});

Schedules.belongsTo(Sections, {
    foreignKey: 'sectionId',
    as: 'sections'
})

module.exports = Schedules;