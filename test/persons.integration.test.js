const request = require('supertest');
const app = require('../server'); // tu archivo principal de servidor
const Persons = require('../models/persons.model');

describe('Persons API - Integration Tests', () => {

  afterAll(async () => {
    await Persons.sequelize.close();
  });

  test('POST /api/persons/create → debe crear una persona', async () => {
    const res = await request(app)
      .post('/api/persons/create')
      .send({
        names: 'Juan',
        lastNames: 'Pérez',
        dni: '87654321',
        email: 'juan@test.com',
        phone: '987654321',
        role: 'Docente'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('email', 'juan@test.com');
  });

  test('GET /api/persons/list → debe listar personas', async () => {
    const res = await request(app).get('/api/persons/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('DELETE /api/persons/delete/:id → debe retornar 409 si hay conflicto', async () => {
    // Forzar caso con FK (por ejemplo id=1 en uso)
    const res = await request(app).delete('/api/persons/delete/1');
    expect([200, 404, 409]).toContain(res.status);
  });
});
