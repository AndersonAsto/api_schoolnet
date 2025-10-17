// test/teachersAssignments.unit.test.js
const teachersAssignmentsController = require('../controllers/teachersAssignments.controller');
const TeacherAssignments = require('../models/teachersAssignments.model');
const Persons = require('../models/persons.model');
const Years = require('../models/years.model');
const Courses = require('../models/courses.model');

// Mock de los modelos
jest.mock('../models/teachersAssignments.model');
jest.mock('../models/persons.model');
jest.mock('../models/years.model');
jest.mock('../models/courses.model');

// Simulamos los objetos req y res
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('🎯 Controlador: teachersAssignments', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTeacherAssignament', () => {
    it('✅ debe crear una asignación correctamente', async () => {
      const req = { body: { personId: 1, yearId: 1, courseId: 1 } };
      const res = mockResponse();

      TeacherAssignments.create.mockResolvedValue({
        id: 10, personId: 1, yearId: 1, courseId: 1
      });

      await teachersAssignmentsController.createTeacherAssignament(req, res);

      expect(TeacherAssignments.create).toHaveBeenCalledWith({ personId: 1, yearId: 1, courseId: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
    });

    it('⚠️ debe retornar 400 si faltan campos obligatorios', async () => {
      const req = { body: { personId: null, yearId: 1 } };
      const res = mockResponse();

      await teachersAssignmentsController.createTeacherAssignament(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'No ha completado algunos campos'
      }));
    });

    it('❌ debe capturar errores del modelo', async () => {
      const req = { body: { personId: 1, yearId: 1, courseId: 1 } };
      const res = mockResponse();

      TeacherAssignments.create.mockRejectedValue(new Error('DB error'));

      await teachersAssignmentsController.createTeacherAssignament(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error al crear asignaciones de docentes'
      }));
    });
  });

  describe('getTeacherAssignaments', () => {
    it('✅ debe devolver un arreglo de asignaciones', async () => {
      const req = {};
      const res = mockResponse();

      TeacherAssignments.findAll.mockResolvedValue([
        { id: 1, personId: 1, yearId: 1, courseId: 1 }
      ]);

      await teachersAssignmentsController.getTeacherAssignaments(req, res);

      expect(TeacherAssignments.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it('❌ debe capturar errores al listar', async () => {
      const req = {};
      const res = mockResponse();

      TeacherAssignments.findAll.mockRejectedValue(new Error('DB error'));

      await teachersAssignmentsController.getTeacherAssignaments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error al obtener asignaciones de docentes'
      }));
    });
  });

});
