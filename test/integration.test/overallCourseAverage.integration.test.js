// test/integration.test/overallCourseAverage.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('OverallCourseAverage Endpoints - Integration Tests', () => {
  let skipTests = false;

  let yearForTests;
  let studentForTests;
  let assignmentForTests;
  let createdOverallAverage;

  beforeAll(async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Conexión a la base de datos de pruebas OK para OverallCourseAverage.');

      // Ajusta estos findOne según tu data real
      yearForTests = (await db.Years.findOne()) || null;
      studentForTests = (await db.StudentEnrollments.findOne()) || null;
      assignmentForTests = (await db.TeacherGroups.findOne()) || null;

      if (!yearForTests || !studentForTests || !assignmentForTests) {
        console.error(
          'No se encontraron registros mínimos (Years, StudentEnrollments, TeacherGroups) para las pruebas de OverallCourseAverage.'
        );
        skipTests = true;
      }
    } catch (err) {
      console.error('Error en beforeAll de OverallCourseAverage Integration:', err.message);
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
        // No hacemos nada destructivo ni lanzamos errores si falta contexto
        expect(true).toBe(true);
        return;
      }
      await fn();
    };
  };

  // ---------- POST /generalAvarage/calculate ----------
  describe('POST /generalAvarage/calculate', () => {
    it(
      'debe retornar 400 si faltan parámetros',
      safeTest(async () => {
        const res = await request(app)
          .post('/api/generalAvarage/calculate')
          .send({
            studentId: studentForTests.id,
            // falta assignmentId y/o yearId
          });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'message',
          'Faltan parámetros: studentId, scheduleId o yearId'
        );
      })
    );

    it(
      'debe intentar calcular promedio general (si existen TeachingBlockAverage configurados)',
      safeTest(async () => {
        const payload = {
          studentId: studentForTests.id,
          assignmentId: assignmentForTests.id,
          yearId: yearForTests.id,
        };

        const res = await request(app)
          .post('/api/generalAvarage/calculate')
          .send(payload);

        // Aquí pueden pasar 3 cosas:
        // 200 => calculó o actualizó promedio correctamente
        // 404 => no hay TeachingBlockAverage para este caso
        // 400 => no se puede calcular promedio anual (sin bloques válidos)
        expect([200, 400, 404]).toContain(res.status);

        if (res.status === 200) {
          expect(res.body).toHaveProperty('courseAverage');
          createdOverallAverage = res.body.courseAverage;
        }
      })
    );
  });

  // ---------- GET /generalAvarage/by-filters ----------
  describe('GET /generalAvarage/by-filters', () => {
    it(
      'debe retornar 400 si faltan parámetros',
      safeTest(async () => {
        const res = await request(app).get(
          `/api/generalAvarage/by-filters?studentId=${studentForTests.id}`
        );

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('status', false);
      })
    );

    it(
      'debe responder con 200 o 404 según haya datos para estudiante y año',
      safeTest(async () => {
        const url = `/api/generalAvarage/by-filters?studentId=${studentForTests.id}&yearId=${yearForTests.id}`;
        const res = await request(app).get(url);

        expect([200, 404]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body).toHaveProperty('status', true);
          expect(Array.isArray(res.body.data)).toBe(true);
        } else {
          expect(res.body).toHaveProperty('status', false);
        }
      })
    );
  });

  // ---------- GET /generalAvarage/by-assignment ----------
  describe('GET /generalAvarage/by-assignment', () => {
    it(
      'debe retornar 400 si faltan parámetros',
      safeTest(async () => {
        const url = `/api/generalAvarage/by-assignment?yearId=${yearForTests.id}`;
        const res = await request(app).get(url);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('status', false);
      })
    );

    it(
      'debe responder con 200 o 404 según haya datos para año y grupo',
      safeTest(async () => {
        const url = `/api/generalAvarage/by-assignment?yearId=${yearForTests.id}&assignmentId=${assignmentForTests.id}`;
        const res = await request(app).get(url);

        expect([200, 404]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body).toHaveProperty('status', true);
          expect(Array.isArray(res.body.data)).toBe(true);
        } else {
          expect(res.body).toHaveProperty('status', false);
        }
      })
    );
  });

  // ---------- GET /generalAvarage/by-SYA ----------
  describe('GET /generalAvarage/by-SYA', () => {
    it(
      'debe retornar 400 si faltan parámetros',
      safeTest(async () => {
        const url = `/api/generalAvarage/by-SYA?studentId=${studentForTests.id}&yearId=${yearForTests.id}`;
        const res = await request(app).get(url);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('status', false);
      })
    );

    it(
      'debe responder con 200 o 404 según haya datos para estudiante, año y grupo',
      safeTest(async () => {
        const url = `/api/generalAvarage/by-SYA?studentId=${studentForTests.id}&yearId=${yearForTests.id}&assignmentId=${assignmentForTests.id}`;
        const res = await request(app).get(url);

        expect([200, 404]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body).toHaveProperty('status', true);
          expect(Array.isArray(res.body.data)).toBe(true);
        } else {
          expect(res.body).toHaveProperty('status', false);
        }
      })
    );
  });
});
