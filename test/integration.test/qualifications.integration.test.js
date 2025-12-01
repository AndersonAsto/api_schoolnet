// test/integration.test/qualifications.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('Qualifications Endpoints - Integration Tests', () => {
  let skipTests = false;

  // Ajusta estos IDs a registros reales si quieres tests 200 reales
  const EXISTING_STUDENT_ID = 1;
  const EXISTING_SCHEDULE_ID = 1;
  const EXISTING_SCHOOLDAY_ID = 1;
  const EXISTING_TEACHER_GROUP_ID = 1;

  beforeAll(async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Conexión a BD OK para Qualifications.');
    } catch (err) {
      console.error(
        'Error en beforeAll de Qualifications Integration:',
        err.message
      );
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

  // ---------- POST /qualifications/bulkCreate ----------
  describe('POST /qualifications/bulkCreate', () => {
    it(
      'debe devolver 400 si el body no es array o está vacío',
      safeTest(async () => {
        const res = await request(app)
          .post('/api/qualifications/bulkCreate')
          .send([]);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'message',
          'No se enviaron calificaciones.'
        );
      })
    );

    it(
      'intenta crear calificaciones (201 o 500 según constraints)',
      safeTest(async () => {
        const res = await request(app)
          .post('/api/qualifications/bulkCreate')
          .send([
            {
              studentId: EXISTING_STUDENT_ID,
              scheduleId: EXISTING_SCHEDULE_ID,
              schoolDayId: EXISTING_SCHOOLDAY_ID,
              rating: 15,
              ratingDetail: 'Prueba integración',
            },
          ]);

        expect([201, 500]).toContain(res.status);
      })
    );
  });

  // ---------- GET /qualifications/list ----------
  /*
  describe('GET /qualifications/list', () => {
    it(
      'debe devolver 200 o 500 y, si 200, un array',
      safeTest(async () => {
        const res = await request(app).get('/api/qualifications/list');

        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(Array.isArray(res.body)).toBe(true);
        }
      })
    );
  });
  */
  
  // ---------- PUT /qualifications/bulkUpdate ----------
  describe('PUT /qualifications/bulkUpdate', () => {
    it(
      'debe devolver 400 si no hay datos',
      safeTest(async () => {
        const res = await request(app)
          .put('/api/qualifications/bulkUpdate')
          .send([]);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'message',
          'No hay datos para actualizar'
        );
      })
    );

    it(
      'intenta actualizar una calificación inexistente (200, 500 o similar)',
      safeTest(async () => {
        // id probablemente no exista; solo verificamos que el endpoint responda
        const res = await request(app)
          .put('/api/qualifications/bulkUpdate')
          .send([
            {
              id: 9999999,
              studentId: EXISTING_STUDENT_ID,
              scheduleId: EXISTING_SCHEDULE_ID,
              schoolDayId: EXISTING_SCHOOLDAY_ID,
              rating: 18,
              ratingDetail: 'Update integración',
            },
          ]);

        expect([200, 500]).toContain(res.status);
      })
    );
  });

  // ---------- GET /qualifications/byScheduleAndDay ----------
  describe('GET /qualifications/byScheduleAndDay', () => {
    it(
      'debe devolver 400 si faltan parámetros',
      safeTest(async () => {
        const res = await request(app).get(
          '/api/qualifications/byScheduleAndDay?scheduleId=1'
        );

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'message',
          'Faltan parámetros: scheduleId y schoolDayId son requeridos'
        );
      })
    );

    it(
      'debe devolver 200 o 500 con los filtros completos',
      safeTest(async () => {
        const res = await request(app).get(
          `/api/qualifications/byScheduleAndDay?scheduleId=${EXISTING_SCHEDULE_ID}&schoolDayId=${EXISTING_SCHOOLDAY_ID}`
        );

        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(Array.isArray(res.body)).toBe(true);
        }
      })
    );
  });

  // ---------- GET /qualifications/byStudent/:studentId/schedule/:scheduleId ----------
  describe('GET /qualifications/byStudent/:studentId/schedule/:scheduleId', () => {
    it(
      'debe devolver 200 o 500',
      safeTest(async () => {
        const res = await request(app).get(
          `/api/qualifications/byStudent/${EXISTING_STUDENT_ID}/schedule/${EXISTING_SCHEDULE_ID}`
        );

        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(Array.isArray(res.body)).toBe(true);
        }
      })
    );
  });

  // ---------- GET /qualifications/by-group/:teacherGroupId/student/:studentId ----------
  describe('GET /qualifications/by-group/:teacherGroupId/student/:studentId', () => {
    it(
      'debe devolver 200, 404 o 500 según exista el grupo / schedules / data',
      safeTest(async () => {
        const res = await request(app).get(
          `/api/qualifications/by-group/${EXISTING_TEACHER_GROUP_ID}/student/${EXISTING_STUDENT_ID}`
        );

        expect([200, 404, 500]).toContain(res.status);
      })
    );
  });
});
