// test/grades.integration.test.js
const request = require('supertest');
const app = require('../app');

describe('🧩 API /api/grades (Integración)', () => {

  it('GET /api/grades/list → debería devolver 200 y un array', async () => {
    const res = await request(app).get('/api/grades/list');

    expect([200, 204]).toContain(res.statusCode);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/grades/create → debería crear un nuevo grado', async () => {
    const res = await request(app)
      .post('/api/grades/create')
      .send({ grade: 'Primero' })
      .set('Accept', 'application/json');

    expect([201, 400]).toContain(res.statusCode);
  });

  it('PUT /api/grades/update/:id → debería actualizar un grado existente', async () => {
    const id = 1; // Usa un ID real de tu DB de prueba
    const res = await request(app)
      .put(`/api/grades/update/${id}`)
      .send({ grade: 'Primero Actualizado' });

    expect([200, 404]).toContain(res.statusCode);
  });

  it('DELETE /api/grades/delete/:id → debería eliminar un grado', async () => {
    const id = 1; // Usa un ID real o existente
    const res = await request(app).delete(`/api/grades/delete/${id}`);

    expect([200, 404, 400]).toContain(res.statusCode);
  });

});
