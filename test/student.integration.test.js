const request = require('supertest');
const express = require('express');
const router = require('../routes/studentEnrollments.routes');

const app = express();
app.use(express.json());
app.use('/api', router);

describe('Pruebas de Integración - Rutas de StudentEnrollments', () => {
  it('✅ GET /api/studentEnrollments/list debería responder con 200', async () => {
    const res = await request(app).get('/api/studentEnrollments/list');
    expect(res.statusCode).toBe(200);
  });

  it('❌ GET /api/studentEnrollments/bySchedule sin ID debería devolver 400', async () => {
    const res = await request(app).get('/api/studentEnrollments/bySchedule/');
    expect([400, 404]).toContain(res.statusCode);
  });

  it('✅ POST /api/studentEnrollments/create debería devolver 400 si faltan campos', async () => {
    const res = await request(app)
      .post('/api/studentEnrollments/create')
      .send({});
    expect(res.statusCode).toBe(400);
  });
});
