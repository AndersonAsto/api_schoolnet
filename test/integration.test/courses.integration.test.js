const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('Courses Endpoints - Integration Tests', () => {
  let createdCourse;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('POST /api/courses/create', () => {
    it('debe devolver 400 si no se envía course', async () => {
      const res = await request(app)
        .post('/api/courses/create')
        .send({ recurrence: 'Semanal' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'No ha completado los campos requeridos.');
    });

    it('debe crear un nuevo curso y devolver 201', async () => {
      const res = await request(app)
        .post('/api/courses/create')
        .send({ course: 'Matemática', recurrence: 'Semanal' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('course', 'Matemática');

      createdCourse = res.body;
    });
  });

  describe('GET /api/courses/list', () => {
    it('debe devolver el listado de cursos', async () => {
      const res = await request(app).get('/api/courses/list');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PUT /api/courses/update/:id', () => {
    it('debe actualizar un curso existente y devolver 200', async () => {
      const res = await request(app)
        .put(`/api/courses/update/${createdCourse.id}`)
        .send({ course: 'Historia', recurrence: 'Mensual' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdCourse.id);
      expect(res.body).toHaveProperty('course', 'Historia');
      expect(res.body).toHaveProperty('recurrence', 'Mensual');
    });

    it('debe devolver 404 si el curso no existe', async () => {
      const res = await request(app)
        .put('/api/courses/update/99999')
        .send({ course: 'Otro', recurrence: 'Semanal' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Curso no encontrado');
    });
  });

  describe('DELETE /api/courses/delete/:id', () => {
    it('debe eliminar un curso existente y devolver 200', async () => {
      const res = await request(app)
        .delete(`/api/courses/delete/${createdCourse.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Curso eliminado correctamente');
    });

    it('debe devolver 404 si el curso no existe', async () => {
      const res = await request(app)
        .delete('/api/courses/delete/99999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Curso no encontrado');
    });
  });
});
