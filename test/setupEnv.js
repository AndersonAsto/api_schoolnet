process.env.NODE_ENV = 'test';

// Puedes sobrescribir algunas vars si quieres asegurarte:
process.env.DB_NAME = process.env.DB_TEST_NAME || process.env.DB_NAME;