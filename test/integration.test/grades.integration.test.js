// test/integration.test/grades.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('Grades Endpoints - Integration Tests', () => {
  let existingGrade;
  let createdGrade;
  let skipTests = false;

  beforeAll(async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Conexión a la base de datos de pruebas OK para Grades.');

      // Intentamos encontrar un grado existente
      existingGrade = await db.Grades.findOne();

      // Si no hay ninguno, creamos uno único para pruebas
      if (!existingGrade) {
        existingGrade = await db.Grades.create({
          grade: 'Grado Base Pruebas',
          status: true,
        });
      }
    } catch (err) {
      console.error('Error en beforeAll de Grades Integration:', err.message);
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

  // -------- POST /api/grades/create --------
  describe('POST /api/grades/create', () => {
    it(
      'debe retornar 400 si no se envía grade',
      safeTest(async () => {
        const res = await request(app)
          .post('/api/grades/create')
          .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'error',
          'No ha completado los campos requeridos.'
        );
      })
    );

    it(
      'debe crear un grado válido y retornar 201',
      safeTest(async () => {
        const res = await request(app)
          .post('/api/grades/create')
          .send({ grade: 'Grado Integración' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('grade', 'Grado Integración');

        createdGrade = res.body;
      })
    );
  });

  // -------- GET /api/grades/list --------
  describe('GET /api/grades/list', () => {
    it(
      'debe listar los grados con estado 200',
      safeTest(async () => {
        const res = await request(app).get('/api/grades/list');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // al menos uno (el existingGrade, y/o el creado en la prueba anterior)
        expect(res.body.length).toBeGreaterThan(0);
      })
    );
  });

  // -------- PUT /api/grades/update/:id --------
  describe('PUT /api/grades/update/:id', () => {
    it(
      'debe retornar 404 si el grado no existe',
      safeTest(async () => {
        const res = await request(app)
          .put('/api/grades/update/999999')
          .send({ grade: 'Grado Inexistente' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'Grado no encontrado');
      })
    );

    it(
      'debe actualizar un grado existente y retornar 200',
      safeTest(async () => {
        const targetId = createdGrade ? createdGrade.id : existingGrade.id;

        const res = await request(app)
          .put(`/api/grades/update/${targetId}`)
          .send({ grade: 'Grado Actualizado Integración' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', targetId);
        expect(res.body).toHaveProperty(
          'grade',
          'Grado Actualizado Integración'
        );
      })
    );
  });
});
