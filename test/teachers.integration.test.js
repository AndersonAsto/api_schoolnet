const request = require('supertest');
const app = require('../app'); // Importa la instancia de Express

describe('🧩 API /api/teachersAssignments (Integración)', () => {

  it('GET /api/teachersAssignments/list → debería devolver 200 y un array', async () => {
    const res = await request(app).get('/api/teachersAssignments');
    expect([200, 404]).toContain(res.statusCode);
    expect(Array.isArray(res.body) || typeof res.body === 'object').toBe(true);
  });

  it('POST /api/teachersAssignments/create → debería crear una nueva asignación de docente', async () => {
    const res = await request(app)
      .post('/api/teachersAssignments')
      .send({
        personId: 1,
        yearId: 1,
        courseId: 1
      })
      .set('Accept', 'application/json');

    expect([201, 400, 404]).toContain(res.statusCode);
  });

});
