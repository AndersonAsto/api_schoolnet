// test/integration.test/years.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

// MOCK de middlewares auth y authorize SOLO en este archivo
jest.mock('../../middlewares/auth.middleware', () => {
  // devolvemos una función que actúa como middleware y simula un usuario admin
  return () => (req, res, next) => {
    req.user = {
      id: 1,
      role: 'Administrador',
    };
    next();
  };
});

jest.mock('../../middlewares/authorize.middleware', () => {
  return (rolesPermitidos) => (req, res, next) => {
    // Ignoramos rolesPermitidos, siempre dejamos pasar porque ya simulamos admin
    next();
  };
});

describe('Years Endpoints - Integration Tests', () => {

  beforeAll(async () => {
    // Sincroniza la BD de pruebas. Si quieres limpiar tablas:
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /api/years/create', () => {
    it('debe crear un nuevo año y devolver 201', async () => {
      const res = await request(app)
        .post('/api/years/create')
        .send({ year: 2024 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.year).toBe(2024);
    });

    it('debe devolver 400 si no se envía year', async () => {
      const res = await request(app)
        .post('/api/years/create')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'No ha completado los campos requeridos.');
    });
  });

  describe('GET /api/years/list', () => {
    it('debe devolver el listado de años ordenado', async () => {
      // Creamos algunos datos adicionales
      await db.Years.create({ year: 2020 });
      await db.Years.create({ year: 2022 });

      const res = await request(app)
        .get('/api/years/list');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Verificamos que esté ordenado por year asc (no es estrictamente necesario chequear todo, pero ayuda)
      const yearsArray = res.body.map(y => y.year);
      const sorted = [...yearsArray].sort((a, b) => a - b);
      expect(yearsArray).toEqual(sorted);
    });
  });

  describe('PUT /api/years/update/:id', () => {
    it('debe actualizar un año existente y devolver 200', async () => {
      const yearCreated = await db.Years.create({ year: 2030 });

      const res = await request(app)
        .put(`/api/years/update/${yearCreated.id}`)
        .send({ year: 2031 });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(yearCreated.id);
      expect(res.body.year).toBe(2031);
    });

    it('debe devolver 404 si el año no existe', async () => {
      const res = await request(app)
        .put('/api/years/update/99999')
        .send({ year: 2050 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Año no encontrado.');
    });
  });

  describe('DELETE /api/years/delete/:id', () => {
    it('debe eliminar un año existente y devolver 200', async () => {
      const year = await db.Years.create({ year: 2040 });

      const res = await request(app)
        .delete(`/api/years/delete/${year.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Año eliminado correctamente.');

      const inDb = await db.Years.findByPk(year.id);
      expect(inDb).toBeNull();
    });

    it('debe devolver 404 si el año no existe', async () => {
      const res = await request(app)
        .delete('/api/years/delete/99999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Año no encontrado.');
    });
  });
});
