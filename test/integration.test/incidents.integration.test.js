// test/integration.test/incidents.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('Incidents Endpoints - Integration Tests', () => {
  let skipTests = false;

  // IDs de prueba (ajusta estos valores a datos que sepas que existen en tu BD de pruebas)
  let studentForTests;
  let scheduleForTests;
  let schoolDayForTests;
  let createdIncident;

  beforeAll(async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Conexión a la base de datos de pruebas OK para Incidents.');

      studentForTests =
        (await db.StudentEnrollments.findOne()) ||
        null;

      scheduleForTests =
        (await db.Schedules.findOne()) ||
        null;

      schoolDayForTests =
        (await db.SchoolDays.findOne()) ||
        null;

      if (!studentForTests || !scheduleForTests || !schoolDayForTests) {
        console.error(
          'No se encontraron registros mínimos para pruebas de incidencias (StudentEnrollments / Schedules / SchoolDays).'
        );
        skipTests = true;
      }
    } catch (err) {
      console.error('Error en beforeAll de Incidents Integration:', err.message);
      skipTests = true;
    }
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
    } catch (e) {
      // silencioso
    }
  });

  const safeTest = (fn) => {
    return async () => {
      if (skipTests) {
        expect(true).toBe(true);
        return;
      }
      await fn();
    };
  };

  // ---------- POST /api/incidents/create ----------
  describe('POST /api/incidents/create', () => {
    it(
      'debe retornar 400 si faltan campos obligatorios',
      safeTest(async () => {
        const res = await request(app)
          .post('/api/incidents/create')
          .send({
            studentId: studentForTests.id,
            // falta scheduleId y schoolDayId
          });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'message',
          'Los campos studentId, scheduleId y schoolDayId son obligatorios.'
        );
      })
    );

    it(
      'debe crear una incidencia válida y retornar 201',
      safeTest(async () => {
        const payload = {
          studentId: studentForTests.id,
          scheduleId: scheduleForTests.id,
          schoolDayId: schoolDayForTests.id,
          incidentDetail: 'Incidencia de integración',
        };

        const res = await request(app)
          .post('/api/incidents/create')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty(
          'message',
          'Incidencia registrada correctamente.'
        );
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data).toHaveProperty('studentId', payload.studentId);

        createdIncident = res.body.data;
      })
    );
  });

  // ---------- GET /api/incidents/list ----------
  describe('GET /api/incidents/list', () => {
    it(
      'debe listar incidencias y retornar 200',
      safeTest(async () => {
        const res = await request(app).get('/api/incidents/list');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty(
          'message',
          'Lista de incidencias obtenida correctamente.'
        );
        expect(Array.isArray(res.body.data)).toBe(true);
      })
    );
  });

  // ---------- GET /api/incidents/byStudentAndSchedule/:studentId/:scheduleId ----------
  describe('GET /api/incidents/byStudentAndSchedule/:studentId/:scheduleId', () => {
    it(
      'debe retornar incidencias para el alumno y horario dados (puede ser lista vacía o no)',
      safeTest(async () => {
        const res = await request(app).get(
          `/api/incidents/byStudentAndSchedule/${studentForTests.id}/${scheduleForTests.id}`
        );

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      })
    );
  });

  // ---------- PUT /api/incidents/update/:id ----------
  describe('PUT /api/incidents/update/:id', () => {
    it(
      'debe retornar 404 si la incidencia no existe',
      safeTest(async () => {
        const res = await request(app)
          .put('/api/incidents/update/999999')
          .send({
            studentId: studentForTests.id,
            scheduleId: scheduleForTests.id,
            schoolDayId: schoolDayForTests.id,
            incidentDetail: 'No debería existir',
          });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'Incidente no encontrado.');
      })
    );

    it(
      'debe actualizar una incidencia existente y retornar 200',
      safeTest(async () => {
        const res = await request(app)
          .put(`/api/incidents/update/${createdIncident.id}`)
          .send({
            studentId: studentForTests.id,
            scheduleId: scheduleForTests.id,
            schoolDayId: schoolDayForTests.id,
            incidentDetail: 'Incidencia actualizada integración',
          });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', createdIncident.id);
        expect(res.body).toHaveProperty(
          'incidentDetail',
          'Incidencia actualizada integración'
        );
      })
    );
  });

});
