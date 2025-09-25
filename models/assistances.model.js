const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const StudentEnrollments = require('../models/studentsEnrollments.model');
const Schedules = require('../models/schedules.model');
const TeachingDays = require('../models/teachingDays.model');

const Assistances = sequelize.define('Assistances', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: StudentEnrollments,
            key: 'id'
        }
    },
    scheduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Schedules,
            key: 'id'
        }
    },
    schoolDayId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TeachingDays,
            key: 'id'
        }
    },
    assistance: {
        type: DataTypes.ENUM('P', 'J', 'T', 'F'),
        allowNull: false,
    },
    assistanceDetail: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'assistances',
    timestamps: true
});

Assistances.belongsTo(StudentEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

Assistances.belongsTo(Schedules, {
    foreignKey: 'scheduleId',
    as: 'schedules'
});

Assistances.belongsTo(TeachingDays, {
    foreignKey: 'schoolDayId',
    as: 'schooldays'
});

module.exports = Assistances;