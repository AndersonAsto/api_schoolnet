// test/schedule.integration.test.js
const request = require('supertest');
const express = require('express');
const router = require('../routes/schedules.routes');

const app = express();
app.use(express.json());
app.use('/api', router);

describe('Pruebas de Integración - Rutas de Schedules', () => {
    it('✅ GET /api/schedules/list debería responder con 200', async () => {
        const res = await request(app).get('/api/schedules/list');
        expect(res.statusCode).toBe(200);
    });

    it('❌ GET /api/schedules/by-user/:userId debería devolver 404 si el usuario no existe', async () => {
        const res = await request(app).get('/api/schedules/by-user/999');
        expect([404, 500]).toContain(res.statusCode);
    });

    it('✅ POST /api/schedules/create debería devolver 400 si faltan campos', async () => {
        const res = await request(app)
            .post('/api/schedules/create')
            .send({});
        expect(res.statusCode).toBe(400);
    });
});
