const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const StudentsEnrollments = require('./studentsEnrollments.model');
const Years = require('./years.model');

const AnnualAverage = sequelize.define('AnnualAverage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
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
    average: {
        type: DataTypes.DECIMAL,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'annualaverage',
    timestamps: true
});

AnnualAverage.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
});

AnnualAverage.belongsTo(StudentsEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

module.exports = AnnualAverage;