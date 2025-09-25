require('dotenv').config({ quiet: true });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize (
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
        timezone: process.env.DB_TIMEZONE,
        dialectOptions: {
            dateStrings: true,
            typeCast: true,
        },
        logging: false
    }
);

module.exports = sequelize;