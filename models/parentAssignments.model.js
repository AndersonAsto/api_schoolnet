const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const StudentEnrollments = require('./studentEnrollments.model');
const Persons = require('./persons.model');
const Years = require('./years.model');

const RepresentativesAssignments = sequelize.define('RepresentativesAssignments', {
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
    tableName: 'representativesassignments'
});

RepresentativesAssignments.belongsTo(StudentEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

RepresentativesAssignments.belongsTo(Persons, {
    foreignKey: 'personId',
    as: 'persons'
});

RepresentativesAssignments.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
});

module.exports = RepresentativesAssignments;