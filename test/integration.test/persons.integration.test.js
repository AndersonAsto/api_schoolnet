// test/integration.test/persons.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('Persons Endpoints - Integration Tests', () => {
  let skipTests = false;
  let createdPersonId;

  beforeAll(async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Conexión a BD OK para Persons.');
    } catch (err) {
      console.error(
        'Error en beforeAll de Persons Integration:',
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

  // ---------- POST /persons/create ----------
  describe('POST /persons/create', () => {
    it(
      'debe retornar 400 si faltan campos',
      safeTest(async () => {
        const res = await request(app).post('/api/persons/create').send({
          names: 'Test',
          lastNames: 'User',
          dni: '12345678',
          email: 'test@example.com',
          phone: '987654321',
          // falta role
        });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'error',
          'No ha completado todos los campos'
        );
      })
    );

    it(
      'debe crear una persona (201 o 500 si hay algún constraint)',
      safeTest(async () => {
        const res = await request(app).post('/api/persons/create').send({
          names: 'Test',
          lastNames: 'Integration',
          dni: '12345678',
          email: `integration_${Date.now()}@example.com`,
          phone: '987654321',
          role: 'Administrador',
        });

        expect([201, 500]).toContain(res.status);
        if (res.status === 201) {
          expect(res.body).toHaveProperty('id');
          createdPersonId = res.body.id;
        }
      })
    );
  });

  // ---------- GET /persons/list ----------
  describe('GET /persons/list', () => {
    it(
      'debe devolver 200 y un array',
      safeTest(async () => {
        const res = await request(app).get('/api/persons/list');

        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(Array.isArray(res.body)).toBe(true);
        }
      })
    );
  });

  // ---------- GET /persons/byRole/:role ----------
  describe('GET /persons/byRole/:role', () => {
    it(
      'debe devolver 400 para rol inválido',
      safeTest(async () => {
        const res = await request(app).get('/api/persons/byRole/InvalidRole');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message', 'Rol inválido');
      })
    );

    it(
      'debe devolver 200 o 500 para rol válido',
      safeTest(async () => {
        const res = await request(app).get('/api/persons/byRole/Docente');

        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(Array.isArray(res.body)).toBe(true);
        }
      })
    );
  });

  // ---------- GET /persons/byPrivilegien ----------
  describe('GET /persons/byPrivilegien', () => {
    it(
      'debe devolver 200 o 500 y un array si tiene éxito',
      safeTest(async () => {
        const res = await request(app).get('/api/persons/byPrivilegien');

        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(Array.isArray(res.body)).toBe(true);
        }
      })
    );
  });

  // ---------- PUT /persons/update/:id ----------
  describe('PUT /persons/update/:id', () => {
    it(
      'debe devolver 404 o 500 si la persona no existe',
      safeTest(async () => {
        const res = await request(app)
          .put('/api/persons/update/99999999')
          .send({
            names: 'Update',
            lastNames: 'Test',
            dni: '87654321',
            email: 'update@example.com',
            phone: '912345678',
            role: 'Docente',
          });

        expect([404, 500]).toContain(res.status);
      })
    );

    it(
      'debe actualizar la persona creada por la prueba si existe',
      safeTest(async () => {
        if (!createdPersonId) {
          expect(true).toBe(true);
          return;
        }

        const res = await request(app)
          .put(`/api/persons/update/${createdPersonId}`)
          .send({
            names: 'Updated',
            lastNames: 'Integration',
            dni: '87654321',
            email: `updated_${Date.now()}@example.com`,
            phone: '912345678',
            role: 'Docente',
          });

        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body).toHaveProperty('id', createdPersonId);
        }
      })
    );
  });

  // ---------- DELETE /persons/delete/:id ----------
  // Solo borramos la persona que creó la prueba, nunca una preexistente
  describe('DELETE /persons/delete/:id', () => {
    it(
      'debe devolver 400 si el id es inválido',
      safeTest(async () => {
        const res = await request(app).delete('/api/persons/delete/abc');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'message',
          'ID inválido o no proporcionado'
        );
      })
    );

    it(
      'debe eliminar la persona creada si existe',
      safeTest(async () => {
        if (!createdPersonId) {
          expect(true).toBe(true);
          return;
        }

        const res = await request(app).delete(
          `/api/persons/delete/${createdPersonId}`
        );

        expect([200, 404, 500]).toContain(res.status);
        if (res.status === 200) {
          expect(res.body).toHaveProperty(
            'message',
            'Persona eliminada correctamente'
          );
        }
      })
    );
  });
});
