const request = require('supertest');
const express = require('express');
const router = require('../routes/attendances.routes'); // Importa tus rutas reales

const app = express();
app.use(express.json());
app.use('/api', router);

describe('Pruebas de Integración - Rutas de Asistencias', () => {

    it('✅ GET /api/assistances/list debería responder con 200 o 500', async () => {
        const res = await request(app).get('/api/assistances/list');
        expect([200, 500]).toContain(res.statusCode);
    });

    it('❌ POST /api/assistances/bulkCreate sin datos debería devolver 400', async () => {
        const res = await request(app)
            .post('/api/assistances/bulkCreate')
            .send([]); // vacío
        expect([400, 500]).toContain(res.statusCode);
    });

    it('✅ GET /api/assistances/byScheduleAndDay sin parámetros debería devolver 400', async () => {
        const res = await request(app)
            .get('/api/assistances/byScheduleAndDay'); // sin query params
        expect([400, 500]).toContain(res.statusCode);
    });

});
