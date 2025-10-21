const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Years = require('./years.model');
const Schedules = require('./schedules.model');
const TeachingBlocks = require('./teachingBlocks.model');
const SchoolDays = require('./teachingDays.model');

const ScheduleSchoolDays = sequelize.define('ScheduleSchoolDays', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    yearId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Years,
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
    teachingBlockId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TeachingBlocks,
            key: 'id'
        }
    },
    schoolDayId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SchoolDays,
            key: 'id'
        }
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    tableName: 'scheduleschooldays',
    timestamps: true,
});

ScheduleSchoolDays.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
});

ScheduleSchoolDays.belongsTo(Schedules, {
    foreignKey: 'scheduleId',
    as: 'schedules'
});

ScheduleSchoolDays.belongsTo(TeachingBlocks, {
    foreignKey: 'teachingBlockId',
    as: 'teachingBlocks'
});

ScheduleSchoolDays.belongsTo(SchoolDays, {
    foreignKey: 'schoolDayId',
    as: 'schoolDays'
})

module.exports = ScheduleSchoolDays;