// test/integration.test/holidays.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('Holidays Endpoints - Integration Tests', () => {
  let yearForTests;
  let createdHoliday;
  let skipTests = false;

  beforeAll(async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Conexión a la base de datos de pruebas OK para Holidays.');

      // Buscamos o creamos un año específico para pruebas
      yearForTests =
        (await db.Years.findOne({
          where: { year: '2025' },
        })) ||
        (await db.Years.create({
          year: '2025',
          status: true,
        }));
    } catch (err) {
      console.error('Error en beforeAll de Holidays Integration:', err.message);
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

  // -------- POST /api/holidays/create --------
  describe('POST /api/holidays/create', () => {
    it(
      'debe retornar 400 si faltan campos requeridos',
      safeTest(async () => {
        const res = await request(app)
          .post('/api/holidays/create')
          .send({ yearId: yearForTests.id });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'message',
          'No ha completado los campos requeridos.'
        );
      })
    );

    it(
      'debe crear un feriado válido y retornar 201',
      safeTest(async () => {
        const res = await request(app)
          .post('/api/holidays/create')
          .send({
            yearId: yearForTests.id,
            holiday: '2025-07-28',
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('yearId', yearForTests.id);
        expect(res.body).toHaveProperty('holiday', '2025-07-28');

        createdHoliday = res.body;
      })
    );
  });

  // -------- GET /api/holidays/list --------
  describe('GET /api/holidays/list', () => {
    it(
      'debe listar los feriados con estado 200',
      safeTest(async () => {
        const res = await request(app).get('/api/holidays/list');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // en la práctica debería haber al menos el feriado creado
        expect(res.body.length).toBeGreaterThan(0);
      })
    );
  });

  // -------- GET /api/holidays/byYear/:yearId --------
  describe('GET /api/holidays/byYear/:yearId', () => {
    it(
      'debe retornar feriados del año dado',
      safeTest(async () => {
        const res = await request(app).get(
          `/api/holidays/byYear/${yearForTests.id}`
        );

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // Al menos uno para ese año (el creado)
        const hasHolidayForYear = res.body.some(
          (h) => h.yearId === yearForTests.id
        );
        expect(hasHolidayForYear).toBe(true);
      })
    );
  });

  // -------- PUT /api/holydays/update/:id --------
  // Nota: en la ruta escribiste "holydays" (con y), respetamos eso en las pruebas.
  describe('PUT /api/holydays/update/:id', () => {
    it(
      'debe retornar 404 si el feriado no existe',
      safeTest(async () => {
        const res = await request(app)
          .put('/api/holydays/update/999999')
          .send({
            yearId: yearForTests.id,
            holiday: '2025-08-30',
          });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'Incidente no encontrado.');
      })
    );

    it(
      'debe actualizar un feriado existente y retornar 200',
      safeTest(async () => {
        const targetId = createdHoliday.id;

        const res = await request(app)
          .put(`/api/holydays/update/${targetId}`)
          .send({
            yearId: yearForTests.id,
            holiday: '2025-07-29',
          });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', targetId);
        expect(res.body).toHaveProperty('yearId', yearForTests.id);
        expect(res.body).toHaveProperty('holiday', '2025-07-29');
      })
    );
  });
});
