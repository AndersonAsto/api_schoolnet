const {DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');

const Courses = sequelize.define('Courses', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    course: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'courses',
    timestamps: true
});

module.exports = Courses;