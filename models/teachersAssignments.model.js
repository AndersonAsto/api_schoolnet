const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Persons = require('./persons.model');
const Years = require('./years.model');

const TeacherAssignments = sequelize.define('TeacherAssignments', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    personId: {
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
    specialty: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'teacherassignments'
});

TeacherAssignments.belongsTo(Persons, {
    foreignKey: 'personId',
    as: 'persons'
});

TeacherAssignments.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
});

module.exports = TeacherAssignments;