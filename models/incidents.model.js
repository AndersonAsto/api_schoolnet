const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const StudentsEnrollments = require('./studentEnrollments.model');
const Schedules = require('./schedules.model');
const SchoolDays = require('./schoolDays.model');

const Incidents = sequelize.define('Incidents', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        key: {
            model: StudentsEnrollments,
            key: 'id'
        }
    },
    scheduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Schedules,
            key: 'id',
        }
    },
    schoolDayId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SchoolDays,
            key: 'id',
        }
    },
    incidentDetail: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    tableName: 'incidents',
    timestamps: true
});

Incidents.belongsTo(StudentsEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

Incidents.belongsTo(Schedules, {
    foreignKey: 'scheduleId',
    as: 'schedules'
});

Incidents.belongsTo(SchoolDays, {
    foreignKey: 'schoolDayId',
    as: 'schooldays'
});

module.exports = Incidents;