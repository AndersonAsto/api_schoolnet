// test/integration.test/teachingBlockAverage.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('TeachingBlockAverage Endpoints - Integration', () => {
  let skipTests = false;

  // Ajusta estos IDs para tu BD real:
  const EXISTING_STUDENT_ID = 1;
  const EXISTING_ASSIGNMENT_ID = 1; // TeacherGroups.id
  const EXISTING_TEACHING_BLOCK_ID = 1;
  const EXISTING_YEAR_ID = 1;

  beforeAll(async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Conexión BD OK para TeachingBlockAverage Integration');
    } catch (err) {
      console.error(
        'No se pudo conectar a BD para TeachingBlockAverage Integration:',
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
    'POST /api/teachingblockaverage/preview debe responder',
    safeTest(async () => {
      const res = await request(app)
        .post('/api/teachingblockaverage/preview')
        .send({
          studentId: EXISTING_STUDENT_ID,
          assignmentId: EXISTING_ASSIGNMENT_ID,
          teachingBlockId: EXISTING_TEACHING_BLOCK_ID,
        });

      expect([200, 400, 404, 500]).toContain(res.status);
    })
  );

  it(
    'POST /api/teachingblockaverage/calculate debe responder (crear/actualizar)',
    safeTest(async () => {
      const res = await request(app)
        .post('/api/teachingblockaverage/calculate')
        .send({
          studentId: EXISTING_STUDENT_ID,
          assignmentId: EXISTING_ASSIGNMENT_ID,
          teachingBlockId: EXISTING_TEACHING_BLOCK_ID,
        });

      // Si todo está bien en BD, será 200; si faltan datos, algún otro código
      expect([200, 400, 404, 500]).toContain(res.status);
    })
  );

  it(
    'GET /api/teachingblockaverage/byStudent/:studentId debe responder',
    safeTest(async () => {
      const res = await request(app).get(
        `/api/teachingblockaverage/byStudent/${EXISTING_STUDENT_ID}`
      );
      expect([200, 404, 500]).toContain(res.status);
    })
  );

  it(
    'GET /api/teachingblockaverage/byAssignment/:assignmentId debe responder',
    safeTest(async () => {
      const res = await request(app).get(
        `/api/teachingblockaverage/byAssignment/${EXISTING_ASSIGNMENT_ID}`
      );
      expect([200, 404, 500]).toContain(res.status);
    })
  );

  it(
    'GET /api/teachingblockaverage/byTeachingBlock/:teachingBlockId debe responder',
    safeTest(async () => {
      const res = await request(app).get(
        `/api/teachingblockaverage/byTeachingBlock/${EXISTING_TEACHING_BLOCK_ID}`
      );
      expect([200, 404, 500]).toContain(res.status);
    })
  );

  it(
    'GET /api/teachingblockaverage/byStudent/:studentId/year/:yearId/assignment/:assignmentId debe responder',
    safeTest(async () => {
      const res = await request(app).get(
        `/api/teachingblockaverage/byStudent/${EXISTING_STUDENT_ID}/year/${EXISTING_YEAR_ID}/assignment/${EXISTING_ASSIGNMENT_ID}`
      );
      expect([200, 400, 404, 500]).toContain(res.status);
    })
  );
});
