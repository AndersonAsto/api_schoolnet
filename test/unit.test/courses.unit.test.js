const httpMocks = require('node-mocks-http');
const db = require('../../models');
const coursesController = require('../../controllers/courses.controller');

jest.mock('../../models', () => ({
  Courses: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('Courses Controller - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCourse', () => {
    it('debe retornar 400 si no se envía course', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: { recurrence: 'Semanal' },
      });
      const res = httpMocks.createResponse();

      await coursesController.createCourse(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty('error', 'No ha completado los campos requeridos.');
    });

    it('debe crear un curso y devolver 201', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: { course: 'Matemática', recurrence: 'Semanal' },
      });
      const res = httpMocks.createResponse();

      const mockCourse = { id: 1, course: 'Matemática', recurrence: 'Semanal' };
      db.Courses.create.mockResolvedValue(mockCourse);

      await coursesController.createCourse(req, res);

      expect(db.Courses.create).toHaveBeenCalledWith({
        course: 'Matemática',
        recurrence: 'Semanal',
      });
      expect(res.statusCode).toBe(201);
      const data = res._getJSONData();
      expect(data).toEqual(mockCourse);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: { course: 'Comunicación', recurrence: 'Semanal' },
      });
      const res = httpMocks.createResponse();

      db.Courses.create.mockRejectedValue(new Error('Error DB'));

      await coursesController.createCourse(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Error al crear curso');
    });
  });

  describe('getCourses', () => {
    it('debe obtener todos los cursos', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
      });
      const res = httpMocks.createResponse();

      const mockCourses = [
        { id: 1, course: 'Matemática', recurrence: 'Semanal' },
        { id: 2, course: 'Comunicación', recurrence: 'Semanal' },
      ];
      db.Courses.findAll.mockResolvedValue(mockCourses);

      await coursesController.getCourses(req, res);

      expect(db.Courses.findAll).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockCourses);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
      });
      const res = httpMocks.createResponse();

      db.Courses.findAll.mockRejectedValue(new Error('Error DB'));

      await coursesController.getCourses(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  describe('updateCourse', () => {
    it('debe retornar 404 si el curso no existe', async () => {
      const req = httpMocks.createRequest({
        method: 'PUT',
        params: { id: 1 },
        body: { course: 'Historia', recurrence: 2 },
      });
      const res = httpMocks.createResponse();

      db.Courses.findByPk.mockResolvedValue(null);

      await coursesController.updateCourse(req, res);

      expect(db.Courses.findByPk).toHaveBeenCalledWith(1);
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Curso no encontrado');
    });

    it('debe actualizar el curso y devolver 200', async () => {
      const req = httpMocks.createRequest({
        method: 'PUT',
        params: { id: 1 },
        body: { course: 'Historia', recurrence: 2 },
      });
      const res = httpMocks.createResponse();

      const mockCourse = {
        id: 1,
        course: 'Matemática',
        recurrence: 'Semanal',
        save: jest.fn().mockResolvedValue(true),
      };

      db.Courses.findByPk.mockResolvedValue(mockCourse);

      await coursesController.updateCourse(req, res);

      expect(db.Courses.findByPk).toHaveBeenCalledWith(1);
      expect(mockCourse.course).toBe('Historia');
      expect(mockCourse.recurrence).toBe(2);
      expect(mockCourse.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockCourse);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = httpMocks.createRequest({
        method: 'PUT',
        params: { id: 1 },
        body: { course: 'Historia', recurrence: 2 },
      });
      const res = httpMocks.createResponse();

      db.Courses.findByPk.mockRejectedValue(new Error('Error DB'));

      await coursesController.updateCourse(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  describe('deleteCourse', () => {
    it('debe eliminar un curso existente y retornar 200', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        params: { id: 1 },
      });
      const res = httpMocks.createResponse();

      db.Courses.destroy.mockResolvedValue(1);

      await coursesController.deleteCourse(req, res);

      expect(db.Courses.destroy).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Curso eliminado correctamente');
    });

    it('debe retornar 404 si el curso no existe', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        params: { id: 1 },
      });
      const res = httpMocks.createResponse();

      db.Courses.destroy.mockResolvedValue(0);

      await coursesController.deleteCourse(req, res);

      expect(db.Courses.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Curso no encontrado');
    });

    it('debe manejar errores internos con 500', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        params: { id: 1 },
      });
      const res = httpMocks.createResponse();

      db.Courses.destroy.mockRejectedValue(new Error('Error DB'));

      await coursesController.deleteCourse(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });
});
