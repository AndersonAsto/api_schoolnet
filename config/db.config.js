require('dotenv').config({ quiet: true });
const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';

let dbName;
switch (env) {
  case 'test':
    dbName = process.env.DB_TEST_NAME;
    break;
  case 'production':
    dbName = process.env.DB_PROD_NAME || process.env.DB_NAME;
    break;
  default:
    dbName = process.env.DB_NAME;
    break;
}

const sequelize = new Sequelize(
  dbName,
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
    logging: env !== 'test' ? console.log : false,
  }
);

module.exports = sequelize;