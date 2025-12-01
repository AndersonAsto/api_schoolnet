// test/jest.teardown.js
const sequelize = require('../config/db.config');

afterAll(async () => {
  try {
    if (sequelize && sequelize.close) {
      await sequelize.close();
      console.log('[GLOBAL] Conexión Sequelize cerrada');
    }
  } catch (e) {
    console.error('Error al cerrar Sequelize en teardown global:', e.message);
  }
});
