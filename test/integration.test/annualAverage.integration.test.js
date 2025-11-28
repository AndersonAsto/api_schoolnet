const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('AnnualAverage Endpoints - Integration Tests', () => {

  beforeAll(async () => {
    // Limpia la base de datos de prueba
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /api/annualaverage/calculate', () => {
    it('debe devolver 400 si faltan parámetros', async () => {
      const res = await request(app)
        .post('/api/annualaverage/calculate')
        .send({ studentId: 1 }); // falta yearId

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', false);
      expect(res.body).toHaveProperty(
        'message',
        'Faltan parámetros requeridos: studentId o yearId.'
      );
    });

    it('debe devolver 404 si no hay promedios generales para ese estudiante/año', async () => {
      const res = await request(app)
        .post('/api/annualaverage/calculate')
        .send({ studentId: 999, yearId: 2024 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('status', false);
      expect(res.body).toHaveProperty(
        'message',
        'No se encontraron promedios generales para el estudiante en el año indicado.'
      );
    });
  });
});
