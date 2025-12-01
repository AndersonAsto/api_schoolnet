// test/unit.test/grades.unit.test.js
const httpMocks = require('node-mocks-http');
const gradesController = require('../../controllers/grades.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  Grades: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('Grades Controller - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------- createGrade -------
  describe('createGrade', () => {
    it('debe retornar 400 si no se envía grade', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/grades/create',
        body: {},
      });
      const res = httpMocks.createResponse();

      await gradesController.createGrade(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'error',
        'No ha completado los campos requeridos.'
      );
      expect(db.Grades.create).not.toHaveBeenCalled();
    });

    it('debe crear un grado y devolver 201', async () => {
      const mockGrade = { id: 1, grade: 'Primero', status: true };
      db.Grades.create.mockResolvedValue(mockGrade);

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/grades/create',
        body: { grade: 'Primero' },
      });
      const res = httpMocks.createResponse();

      await gradesController.createGrade(req, res);

      expect(db.Grades.create).toHaveBeenCalledWith({ grade: 'Primero' });
      expect(res.statusCode).toBe(201);
      const data = res._getJSONData();
      expect(data).toEqual(mockGrade);
    });

    it('debe manejar errores internos con 500', async () => {
      db.Grades.create.mockRejectedValue(new Error('Falla en BD'));

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/grades/create',
        body: { grade: 'Primero' },
      });
      const res = httpMocks.createResponse();

      await gradesController.createGrade(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ------- getGrades -------
  describe('getGrades', () => {
    it('debe obtener todos los grados', async () => {
      const mockGrades = [
        { id: 1, grade: 'Primero' },
        { id: 2, grade: 'Segundo' },
      ];
      db.Grades.findAll.mockResolvedValue(mockGrades);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/grades/list',
      });
      const res = httpMocks.createResponse();

      await gradesController.getGrades(req, res);

      expect(db.Grades.findAll).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockGrades);
    });

    it('debe manejar errores internos con 500', async () => {
      db.Grades.findAll.mockRejectedValue(new Error('Error en findAll'));

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/grades/list',
      });
      const res = httpMocks.createResponse();

      await gradesController.getGrades(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ------- updateGrade -------
  describe('updateGrade', () => {
    it('debe retornar 404 si el grado no existe', async () => {
      db.Grades.findByPk.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/grades/update/1',
        params: { id: '1' },
        body: { grade: 'Primero Actualizado' },
      });
      const res = httpMocks.createResponse();

      await gradesController.updateGrade(req, res);

      expect(db.Grades.findByPk).toHaveBeenCalledWith('1');
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Grado no encontrado');
    });

    it('debe actualizar el grado y devolver 200', async () => {
      const mockGradeInstance = {
        id: 1,
        grade: 'Primero',
        save: jest.fn().mockResolvedValue(true),
      };
      db.Grades.findByPk.mockResolvedValue(mockGradeInstance);

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/grades/update/1',
        params: { id: '1' },
        body: { grade: 'Primero Actualizado' },
      });
      const res = httpMocks.createResponse();

      await gradesController.updateGrade(req, res);

      expect(db.Grades.findByPk).toHaveBeenCalledWith('1');
      expect(mockGradeInstance.grade).toBe('Primero Actualizado');
      expect(mockGradeInstance.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);

      const data = res._getJSONData();
      expect(data).toMatchObject({
        id: 1,
        grade: 'Primero Actualizado',
      });
    });

    it('debe manejar errores internos con 500', async () => {
      db.Grades.findByPk.mockRejectedValue(new Error('Error en findByPk'));

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/grades/update/1',
        params: { id: '1' },
        body: { grade: 'Primero Actualizado' },
      });
      const res = httpMocks.createResponse();

      await gradesController.updateGrade(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ------- deleteGrade (solo unidad, sin integración) -------
  describe('deleteGrade', () => {
    const { deleteGrade } = require('../../controllers/grades.controller');

    it('debe retornar 400 si el id es inválido o no proporcionado', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/grades/delete/abc',
        params: { id: 'abc' },
      });
      const res = httpMocks.createResponse();

      await deleteGrade(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'ID inválido o no proporcionado'
      );
      expect(db.Grades.destroy).not.toHaveBeenCalled();
    });

    it('debe retornar 404 si el grado no existe', async () => {
      db.Grades.destroy.mockResolvedValue(0);

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/grades/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await deleteGrade(req, res);

      expect(db.Grades.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Grado no encontrado');
    });

    it('debe eliminar el grado y retornar 200', async () => {
      db.Grades.destroy.mockResolvedValue(1);

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/grades/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await deleteGrade(req, res);

      expect(db.Grades.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Grado eliminado correctamente'
      );
    });

    it('debe manejar errores internos con 500', async () => {
      db.Grades.destroy.mockRejectedValue(new Error('Error en destroy'));

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/grades/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await deleteGrade(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });
});
