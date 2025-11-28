const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const StudentEnrollments = require('./studentEnrollments.model');
const Schedules = require('../models/schedules.model');
const TeachingDays = require('./schoolDays.model');

const Attendances = sequelize.define('Attendances', {
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
    tableName: 'attendances',
    timestamps: true
});

Attendances.belongsTo(StudentEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

Attendances.belongsTo(Schedules, {
    foreignKey: 'scheduleId',
    as: 'schedules'
});

Attendances.belongsTo(TeachingDays, {
    foreignKey: 'schoolDayId',
    as: 'schooldays'
});

module.exports = Attendances;