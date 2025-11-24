const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const StudentEnrollments = require('./studentEnrollments.model');
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
            model: StudentEnrollments,
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

AnnualAverage.belongsTo(StudentEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

module.exports = AnnualAverage;