const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const StudentEnrollments = require('./studentEnrollments.model');
const Persons = require('./persons.model');
const Years = require('./years.model');

const ParentAssignments = sequelize.define('RepresentativesAssignments', {
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
    personId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Persons,
            key: 'id'
        }
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: StudentEnrollments,
            key: 'id'
        }
    },
    relationshipType: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'parentassignments'
});

ParentAssignments.belongsTo(StudentEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

ParentAssignments.belongsTo(Persons, {
    foreignKey: 'personId',
    as: 'persons'
});

ParentAssignments.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
});

module.exports = ParentAssignments;