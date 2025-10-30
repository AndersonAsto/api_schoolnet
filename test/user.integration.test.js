// test/users.integration.test.js
const request = require('supertest');
const express = require('express');
const router = require('../routes/users.routes');

const app = express();
app.use(express.json());
app.use('/api', router);

describe('Pruebas de Integración - Rutas de Usuarios', () => {
  it('✅ GET /api/users/list debería responder con 200', async () => {
    const res = await request(app).get('/api/users/list');
    expect(res.statusCode).toBe(200);
  });

  it('❌ GET /api/users/byRole/:role debería devolver 400 si el rol es inválido', async () => {
    const res = await request(app).get('/api/users/byRole/invalido');
    expect(res.statusCode).toBe(400);
  });

  it('✅ POST /api/users/create debería devolver 400 si faltan campos', async () => {
    const res = await request(app)
      .post('/api/users/create')
      .send({});
    expect(res.statusCode).toBe(400);
  });
});
