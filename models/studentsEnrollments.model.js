const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Persons = require('./persons.model');
const Years = require('./years.model');
const Grades = require('./grades.model');
const Sections = require('./sections.model');

const StudentsEnrollments = sequelize.define('StudentsEnrollments', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Persons,
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
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    tableName: 'studentsenrollments',
    timestamps: true
});

StudentsEnrollments.belongsTo(Persons, {
    foreignKey: 'studentId',
    as: 'persons'
});

StudentsEnrollments.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
});

StudentsEnrollments.belongsTo(Grades, {
    foreignKey: 'gradeId',
    as: 'grades'
});

StudentsEnrollments.belongsTo(Sections, {
    foreignKey: 'sectionId',
    as: 'sections'
})

module.exports = StudentsEnrollments;