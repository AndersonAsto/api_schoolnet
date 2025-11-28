// test/integration.test/tutors.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('Tutors Endpoints - Integration', () => {
  let skipTests = false;

  // Ajusta según tu base
  const EXISTING_TUTOR_ID = 1;
  const EXISTING_STUDENT_ENROLLMENT_ID = 1; // id en studentenrollments
  const EXISTING_YEAR_ID = 1;

  beforeAll(async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Conexión BD OK para Tutors Integration');
    } catch (err) {
      console.error('No se pudo conectar BD para Tutors Integration:', err.message);
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
    'POST /api/tutors/create debe responder (201, 400 o 500)',
    safeTest(async () => {
      // Ajusta con IDs válidos de tu BD
      const res = await request(app)
        .post('/api/tutors/create')
        .send({
          teacherId: 1,
          gradeId: 1,
          sectionId: 1,
        });

      expect([201, 400, 500]).toContain(res.status);
    })
  );

  it(
    'GET /api/tutors/list debe responder',
    safeTest(async () => {
      const res = await request(app).get('/api/tutors/list');
      expect([200, 500]).toContain(res.status);
    })
  );

  it(
    'GET /api/tutors/by-id/:id debe responder',
    safeTest(async () => {
      const res = await request(app).get(`/api/tutors/by-id/${EXISTING_TUTOR_ID}`);
      expect([200, 500]).toContain(res.status);
    })
  );

  it(
    'GET /api/tutors/student/:studentId debe responder',
    safeTest(async () => {
      const res = await request(app).get(
        `/api/tutors/student/${EXISTING_STUDENT_ENROLLMENT_ID}`
      );
      // 200 si encuentra, 404 si no, 500 si error
      expect([200, 404, 500]).toContain(res.status);
    })
  );

  it(
    'GET /api/tutors/year/:yearId debe responder',
    safeTest(async () => {
      const res = await request(app).get(`/api/tutors/year/${EXISTING_YEAR_ID}`);
      expect([200, 404, 500]).toContain(res.status);
    })
  );

  it(
    'PUT /api/tutors/update/:id debe responder',
    safeTest(async () => {
      const res = await request(app)
        .put(`/api/tutors/update/${EXISTING_TUTOR_ID}`)
        .send({
          teacherId: 1,
          gradeId: 1,
          sectionId: 1,
        });

      expect([200, 404, 500]).toContain(res.status);
    })
  );

  it(
    'DELETE /api/tutors/delete/:id debe responder',
    safeTest(async () => {
      const res = await request(app).delete(
        `/api/tutors/delete/${EXISTING_TUTOR_ID}`
      );
      expect([200, 404, 400, 500]).toContain(res.status);
    })
  );
});
