/**
 * @file test/schedules.super.test.js
 * Pruebas de integración para los endpoints de horarios (Schedules)
 */

const request = require('supertest');
const app = require('../server'); // tu servidor Express
const Schedules = require('../models/schedules.model');

describe('📅 Schedules API - Integration Tests', () => {

  beforeAll(async () => {
    // Limpiar la tabla antes de comenzar
    await Schedules.destroy({ where: {} });
  });

  test('POST /api/schedules/create → debe crear un horario', async () => {
    const res = await request(app)
      .post('/api/schedules/create')
      .send({
        yearId: 1,
        teacherId: 1,
        courseId: 1,
        gradeId: 1,
        sectionId: 1,
        weekday: 'Lunes',
        startTime: '08:00:00',
        endTime: '09:00:00'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('weekday', 'Lunes');
  });

  test('GET /api/schedules/list → debe listar todos los horarios', async () => {
    const res = await request(app).get('/api/schedules/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/schedules/by-user/:userId → debe retornar los horarios del usuario', async () => {
    const userId = 1; // asegúrate de tener este registro mockeado o cargado
    const res = await request(app).get(`/api/schedules/by-user/${userId}`);
    expect([200, 404]).toContain(res.status); // depende de si existe el usuario
  });

  test('GET /api/schedules/by-user/:userId/year/:yearId → debe retornar horarios del usuario por año', async () => {
    const userId = 1;
    const yearId = 1;
    const res = await request(app).get(`/api/schedules/by-user/${userId}/year/${yearId}`);
    expect([200, 404]).toContain(res.status);
  });

});
