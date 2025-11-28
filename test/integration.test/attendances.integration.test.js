const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('Attendances Endpoints - Integration Tests', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  // ---------- POST /api/assistances/bulkCreate ----------
  describe('POST /api/assistances/bulkCreate', () => {
    it('debe devolver 400 si no se envían asistencias', async () => {
      const res = await request(app)
        .post('/api/assistances/bulkCreate')
        .send([]);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'No se enviaron asistencias.');
    });

    it('debe crear asistencias y devolver 201', async () => {
      const attendances = [
        { assistance: true, scheduleId: 1, schoolDayId: 1, studentId: 1 },
      ];

      const res = await request(app)
        .post('/api/assistances/bulkCreate')
        .send(attendances);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Asistencias registradas correctamente.');
    });
  });

  // ---------- GET /api/assistances/list ----------
  describe('GET /api/assistances/list', () => {
    it('debe devolver 200 y un array (puede estar vacío)', async () => {
      const res = await request(app).get('/api/assistances/list');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ---------- PUT /api/assistances/bulkUpdate ----------
  describe('PUT /api/assistances/bulkUpdate', () => {
    it('debe devolver 400 si no hay datos para actualizar', async () => {
      const res = await request(app)
        .put('/api/assistances/bulkUpdate')
        .send([]);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', false);
      expect(res.body).toHaveProperty('message', 'No hay datos para actualizar.');
    });

    it('debe devolver 500 si se envían registros sin id', async () => {
      const updates = [
        { assistance: true, scheduleId: 1, schoolDayId: 1, studentId: 1 },
      ];

      const res = await request(app)
        .put('/api/assistances/bulkUpdate')
        .send(updates);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- GET /api/assistances/byScheduleAndDay ----------
  describe('GET /api/assistances/byScheduleAndDay', () => {
    it('debe devolver 400 si faltan parámetros', async () => {
      const res = await request(app)
        .get('/api/assistances/byScheduleAndDay')
        .query({ scheduleId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Faltan parámetros: scheduleId y schoolDayId son requeridos'
      );
    });

    it('debe devolver 200 y array (sin importar si hay datos)', async () => {
      const res = await request(app)
        .get('/api/assistances/byScheduleAndDay')
        .query({ scheduleId: 1, schoolDayId: 1 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ---------- GET /api/assistances/byStudent/:studentId/schedule/:scheduleId ----------
  describe('GET /api/assistances/byStudent/:studentId/schedule/:scheduleId', () => {
    it('debe devolver mensaje cuando no existen asistencias', async () => {
      const res = await request(app)
        .get('/api/assistances/byStudent/1/schedule/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'No se encontraron asistencias para este estudiante.'
      );
    });
  });

  // ---------- GET /api/assistances/by-group/:teacherGroupId/student/:studentId ----------
  describe('GET /api/assistances/by-group/:teacherGroupId/student/:studentId', () => {
    it('debe devolver 404 si el grupo de docente no existe', async () => {
      const res = await request(app)
        .get('/api/assistances/by-group/1/student/1');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        'message',
        'Grupo de docente no encontrado'
      );
    });
  });
});
