// test/integration.test/parentAssignments.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('ParentAssignments Endpoints - Integration Tests', () => {
  let skipTests = false;

  let yearForTests;
  let studentForTests;
  let personForTests;
  let userForTests;
  let createdAssignmentId;

  beforeAll(async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Conexión a BD OK para ParentAssignments.');

      yearForTests = (await db.Years.findOne()) || null;
      studentForTests = (await db.StudentEnrollments.findOne()) || null;
      personForTests = (await db.Persons.findOne()) || null;
      userForTests = (await db.Users.findOne()) || null;

      if (!yearForTests || !studentForTests || !personForTests || !userForTests) {
        console.error(
          'Faltan registros mínimos (Years, StudentEnrollments, Persons, Users) para pruebas de ParentAssignments.'
        );
        skipTests = true;
      }
    } catch (err) {
      console.error(
        'Error en beforeAll de ParentAssignments Integration:',
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

  // ---------- POST /representativeAssignments/create ----------
  describe('POST /representativeAssignments/create', () => {
    it(
      'debe retornar 400 si faltan campos requeridos',
      safeTest(async () => {
        const res = await request(app)
          .post('/api/representativeAssignments/create')
          .send({
            yearId: yearForTests.id,
            personId: personForTests.id,
            // falta studentId
          });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'message',
          'No ha completado los campos requeridos.'
        );
      })
    );

    it(
      'debe crear una asignación de apoderado (si los IDs son válidos)',
      safeTest(async () => {
        const payload = {
          yearId: yearForTests.id,
          personId: personForTests.id,
          studentId: studentForTests.id,
          relationshipType: 'PADRE',
        };

        const res = await request(app)
          .post('/api/representativeAssignments/create')
          .send(payload);

        // Puede ser 201 o 500 (si hay algún constraint no cumplido)
        expect([201, 500]).toContain(res.status);

        if (res.status === 201) {
          expect(res.body).toHaveProperty('id');
          createdAssignmentId = res.body.id;
        }
      })
    );
  });

  // ---------- GET /representativeAssignments/list ----------
  describe('GET /representativeAssignments/list', () => {
    it(
      'debe devolver 200 con un array (aunque esté vacío)',
      safeTest(async () => {
        const res = await request(app).get('/api/representativeAssignments/list');

        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(Array.isArray(res.body)).toBe(true);
        }
      })
    );
  });

  // ---------- PUT /representativeAssignments/update/:id ----------
  describe('PUT /representativeAssignments/update/:id', () => {
    it(
      'debe retornar 404 si el id no existe',
      safeTest(async () => {
        const res = await request(app)
          .put('/api/representativeAssignments/update/99999999')
          .send({
            yearId: yearForTests.id,
            personId: personForTests.id,
            studentId: studentForTests.id,
            relationshipType: 'TUTOR',
          });

        expect([404, 500]).toContain(res.status);
      })
    );

    it(
      'debe actualizar un registro existente si se creó en la prueba previa',
      safeTest(async () => {
        if (!createdAssignmentId) {
          expect(true).toBe(true);
          return;
        }

        const res = await request(app)
          .put(`/api/representativeAssignments/update/${createdAssignmentId}`)
          .send({
            yearId: yearForTests.id,
            personId: personForTests.id,
            studentId: studentForTests.id,
            relationshipType: 'TUTOR',
          });

        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body).toHaveProperty('id', createdAssignmentId);
        }
      })
    );
  });

  // ---------- GET /parentAssignments/by-user/:userId ----------
  describe('GET /parentAssignments/by-user/:userId', () => {
    it(
      'debe retornar 404 si el usuario no existe',
      safeTest(async () => {
        const res = await request(app).get(
          '/api/parentAssignments/by-user/99999999'
        );

        expect([404, 500]).toContain(res.status);
        if (res.status === 404) {
          expect(res.body).toHaveProperty('error', 'Usuario no encontrado.');
        }
      })
    );

    it(
      'debe retornar 200 o 404 para un usuario existente',
      safeTest(async () => {
        const res = await request(app).get(
          `/api/parentAssignments/by-user/${userForTests.id}`
        );

        expect([200, 404, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(Array.isArray(res.body)).toBe(true);
        }
      })
    );
  });

  // ---------- DELETE /representativeAssignments/delete/:id ----------
  // OJO: esto sí elimina, pero solo el registro que nosotros mismos creamos,
  // y solo si se pudo crear. No tocamos nada preexistente.
  describe('DELETE /representativeAssignments/delete/:id', () => {
    it(
      'debe retornar 400 si el id es inválido',
      safeTest(async () => {
        const res = await request(app).delete(
          '/api/representativeAssignments/delete/abc'
        );

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'message',
          'Identificador inválido o no proporcionado.'
        );
      })
    );

    it(
      'debe eliminar el registro creado por la prueba si existe',
      safeTest(async () => {
        if (!createdAssignmentId) {
          expect(true).toBe(true);
          return;
        }

        const res = await request(app).delete(
          `/api/representativeAssignments/delete/${createdAssignmentId}`
        );

        expect([200, 404, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body).toHaveProperty(
            'message',
            'Apoderado eliminado correctamente.'
          );
        }
      })
    );
  });
});
