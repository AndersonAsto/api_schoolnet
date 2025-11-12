const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');
const Years = require('./years.model');

const TeachingBlocks = sequelize.define('TeachingBlocks', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    yearId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Years,
            key: 'id'
        }
    },
    teachingBlock: {
        type: DataTypes.STRING(250),
        allowNull: false
    },
    startDay: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    endDay: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'teachingblocks',
    timestamps: true
});

TeachingBlocks.belongsTo(Years, {
    foreignKey: 'yearId',
    as: 'years'
})

module.exports = TeachingBlocks;