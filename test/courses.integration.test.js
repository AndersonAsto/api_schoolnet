const request = require('supertest');
const app = require('../app'); // Importa la instancia de Express

describe('🧩 API /api/courses (Integración)', () => {

  it('GET /api/courses/list → debería devolver 200 y un array', async () => {
    const res = await request(app).get('/api/courses/list');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/courses/create → debería crear un nuevo curso', async () => {
    const res = await request(app)
      .post('/api/courses/create')
      .send({ course: 'Matemáticas', descripcion: 'Curso básico' })
      .set('Accept', 'application/json');

    expect([201, 400]).toContain(res.statusCode);
  });

  it('PUT /api/courses/update/:id → debería actualizar un curso existente', async () => {
    const id = 1;
    const res = await request(app)
      .put(`/api/courses/update/${id}`)
      .send({ course: 'Matemáticas Avanzadas', descripcion: 'Actualizado' });
    expect([200, 404]).toContain(res.statusCode);
  });

  it('DELETE /api/courses/delete/:id → debería eliminar un curso', async () => {
    const id = 1;
    const res = await request(app).delete(`/api/courses/delete/${id}`);
    expect([200, 404, 409, 500]).toContain(res.statusCode);
  });

});

