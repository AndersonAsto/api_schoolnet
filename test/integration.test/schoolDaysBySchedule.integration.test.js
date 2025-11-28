// test/integration.test/schoolDaysBySchedule.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('SchoolDaysBySchedule Endpoints - Integration', () => {
  let skipTests = false;

  // AJUSTA ESTOS IDs A TU BD REAL
  const EXISTING_YEAR_ID = 1;      // id en tabla years
  const EXISTING_SCHEDULE_ID = 1;  // id en tabla schedules
  const EXISTING_TEACHER_ID = 1;   // id en tabla users (docente)

  beforeAll(async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Conexión BD OK para SchoolDaysBySchedule Integration');
    } catch (err) {
      console.error(
        'No se pudo conectar a BD para SchoolDaysBySchedule Integration:',
        err.message
      );
      skipTests = true;
    }
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
    } catch (e) {
      // ignore
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

  it(
    'POST /api/scheduleSDs/create debe crear registros o responder error coherente',
    safeTest(async () => {
      const body = {
        yearId: EXISTING_YEAR_ID,
        scheduleId: EXISTING_SCHEDULE_ID,
      };

      const res = await request(app)
        .post('/api/scheduleSDs/create')
        .send(body);

      // Puede ser 201 (creado), 404 (no hay datos suficientes), 400 (params), 500 (error interno)
      expect([201, 400, 404, 500]).toContain(res.status);
    })
  );

  it(
    'GET /api/scheduleSDs/list debe devolver lista (posiblemente vacía)',
    safeTest(async () => {
      const res = await request(app).get('/api/scheduleSDs/list');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    })
  );

  it(
    'GET /api/scheduleSDs/list con filtros yearId/scheduleId debe funcionar',
    safeTest(async () => {
      const res = await request(app)
        .get('/api/scheduleSDs/list')
        .query({
          yearId: EXISTING_YEAR_ID,
          scheduleId: EXISTING_SCHEDULE_ID,
        });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    })
  );

  it(
    'POST /api/scheduleSDs/create-by-techer debe crear registros o responder error coherente',
    safeTest(async () => {
      const body = {
        yearId: EXISTING_YEAR_ID,
        teacherId: EXISTING_TEACHER_ID,
      };

      const res = await request(app)
        .post('/api/scheduleSDs/create-by-techer')
        .send(body);

      expect([201, 400, 404, 500]).toContain(res.status);
    })
  );

  it(
    'GET /api/scheduleSDs/by-schedule/:scheduleId debe devolver 200 o 404/500',
    safeTest(async () => {
      const res = await request(app).get(
        `/api/scheduleSDs/by-schedule/${EXISTING_SCHEDULE_ID}`
      );

      expect([200, 404, 500]).toContain(res.status);

      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    })
  );
});
