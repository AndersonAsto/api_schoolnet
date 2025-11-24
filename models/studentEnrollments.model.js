const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const Persons = require('./persons.model');
const Years = require('./years.model');
const Grades = require('./grades.model');
const Sections = require('./sections.model');

const StudentEnrollments = sequelize.define('StudentsEnrollments', {
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

StudentEnrollments.belongsTo(Persons, {
    foreignKey: 'studentId',
    as: 'persons'
});

StudentEnrollments.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
});

StudentEnrollments.belongsTo(Grades, {
    foreignKey: 'gradeId',
    as: 'grades'
});

StudentEnrollments.belongsTo(Sections, {
    foreignKey: 'sectionId',
    as: 'sections'
})

module.exports = StudentEnrollments;