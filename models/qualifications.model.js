const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const StudentsEnrollments = require('./studentEnrollments.model');
const Schedules = require('../models/schedules.model');
const TeachingDays = require('./schoolDays.model');
const TeachingBlocks = require('./teachingBlocks.model');

const Qualifications = sequelize.define('Qualifications', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: StudentsEnrollments,
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
        allowNull: true,
        references: {
            model: TeachingBlocks,
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
    rating: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    ratingDetail: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'qualifications',
    timestamps: true
});

Qualifications.belongsTo(StudentsEnrollments, {
    foreignKey: 'studentId',
    as: 'students'
});

Qualifications.belongsTo(Schedules, {
    foreignKey: 'scheduleId',
    as: 'schedules'
});

Qualifications.belongsTo(TeachingDays, {
    foreignKey: 'schoolDayId',
    as: 'schooldays'
});

Qualifications.belongsTo(TeachingBlocks, {
    foreignKey: 'teachingBlockId',
    as: 'teachingblocks'
});

module.exports = Qualifications;