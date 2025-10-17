// test/grades.unit.test.js
const gradesController = require('../controllers/grades.controller');
const Grades = require('../models/grades.model');

// Mock del modelo
jest.mock('../models/grades.model');

// Mock del objeto response
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('🎯 Controlador: Grades', () => {

  beforeEach(() => jest.clearAllMocks());

  describe('createGrade', () => {
    it('✅ debe crear un grado correctamente', async () => {
      const req = { body: { grade: 'Primero' } };
      const res = mockResponse();

      Grades.create.mockResolvedValue({ id: 1, grade: 'Primero' });

      await gradesController.createGrade(req, res);

      expect(Grades.create).toHaveBeenCalledWith({ grade: 'Primero' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });

    it('⚠️ debe devolver 400 si falta el campo grade', async () => {
      const req = { body: { grade: '' } };
      const res = mockResponse();

      await gradesController.createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });

    it('❌ debe capturar errores del modelo', async () => {
      const req = { body: { grade: 'Primero' } };
      const res = mockResponse();

      Grades.create.mockRejectedValue(new Error('DB error'));

      await gradesController.createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error al crear grado'
      }));
    });
  });

  describe('getGrades', () => {
    it('✅ debe devolver una lista de grados', async () => {
      const req = {};
      const res = mockResponse();

      Grades.findAll.mockResolvedValue([{ id: 1, grade: 'Primero' }]);

      await gradesController.getGrades(req, res);

      expect(Grades.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it('❌ debe capturar errores al listar', async () => {
      const req = {};
      const res = mockResponse();

      Grades.findAll.mockRejectedValue(new Error('DB error'));

      await gradesController.getGrades(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error al obtener grados'
      }));
    });
  });

  describe('updateGrade', () => {
    it('✅ debe actualizar correctamente un grado existente', async () => {
      const req = { params: { id: 1 }, body: { grade: 'Segundo' } };
      const res = mockResponse();

      const mockGrade = { id: 1, grade: 'Primero', save: jest.fn().mockResolvedValue(true) };
      Grades.findByPk.mockResolvedValue(mockGrade);

      await gradesController.updateGrade(req, res);

      expect(mockGrade.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('⚠️ debe devolver 404 si el grado no existe', async () => {
      const req = { params: { id: 999 }, body: { grade: 'Segundo' } };
      const res = mockResponse();

      Grades.findByPk.mockResolvedValue(null);

      await gradesController.updateGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Grado no encontrado'
      }));
    });
  });

  describe('deleteGradeById', () => {
    it('✅ debe eliminar un grado correctamente', async () => {
      const req = { params: { id: 1 } };
      const res = mockResponse();

      Grades.destroy.mockResolvedValue(1);

      await gradesController.deleteGradeById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Grado eliminado correctamente'
      }));
    });

    it('⚠️ debe devolver 404 si no se encuentra', async () => {
      const req = { params: { id: 99 } };
      const res = mockResponse();

      Grades.destroy.mockResolvedValue(0);

      await gradesController.deleteGradeById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Grado no encontrado'
      }));
    });

    it('⚠️ debe devolver 400 si el ID es inválido', async () => {
      const req = { params: { id: 'abc' } };
      const res = mockResponse();

      await gradesController.deleteGradeById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('❌ debe capturar errores del modelo', async () => {
      const req = { params: { id: 1 } };
      const res = mockResponse();

      Grades.destroy.mockRejectedValue(new Error('DB error'));

      await gradesController.deleteGradeById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('🚫 debe devolver 409 si hay conflicto de integridad', async () => {
        const req = { params: { id: 1 } };
        const res = mockResponse();

        const conflictError = new Error('FK constraint fails');
        conflictError.name = 'SequelizeForeignKeyConstraintError';

        Grades.destroy.mockRejectedValue(conflictError);

        await gradesController.deleteGradeById(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('conflicto')
        }));
        });
  });

});
