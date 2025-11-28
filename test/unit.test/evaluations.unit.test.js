// test/unit.test/evaluations.unit.test.js
const httpMocks = require('node-mocks-http');
const evaluationsController = require('../../controllers/evaluations.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  Evaluations: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  StudentEnrollments: {
    findByPk: jest.fn(),
  },
  TeacherGroups: {
    findByPk: jest.fn(),
  },
  TeachingBlocks: {
    findByPk: jest.fn(),
  },
  Persons: {},
}));

describe('Evaluations Controller - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createEvaluation ----------
  describe('createEvaluation', () => {
    it('debe retornar 400 si faltan campos obligatorios', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: {
          studentId: 1,
          // falta assigmentId, teachingBlockId, score, type
        },
      });
      const res = httpMocks.createResponse();

      await evaluationsController.createEvaluation(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Todos los campos son obligatorios');
    });

    it('debe retornar 404 si alguna referencia no existe', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: {
          studentId: 1,
          assigmentId: 2,
          teachingBlockId: 3,
          score: 15,
          type: 'Examen',
        },
      });
      const res = httpMocks.createResponse();

      db.StudentEnrollments.findByPk.mockResolvedValue(null);
      db.TeacherGroups.findByPk.mockResolvedValue({});
      db.TeachingBlocks.findByPk.mockResolvedValue({});

      await evaluationsController.createEvaluation(req, res);

      expect(db.StudentEnrollments.findByPk).toHaveBeenCalledWith(1);
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Alguna de las referencias no existe (studentId, assigmentId o teachingBlockId).'
      );
    });

    it('debe crear una evaluación y retornar 201', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: {
          studentId: 1,
          assigmentId: 2,
          teachingBlockId: 3,
          score: 18.5,
          type: 'Examen',
        },
      });
      const res = httpMocks.createResponse();

      db.StudentEnrollments.findByPk.mockResolvedValue({ id: 1 });
      db.TeacherGroups.findByPk.mockResolvedValue({ id: 2 });
      db.TeachingBlocks.findByPk.mockResolvedValue({ id: 3 });

      const mockExam = { id: 10, ...req.body };
      db.Evaluations.create.mockResolvedValue(mockExam);

      await evaluationsController.createEvaluation(req, res);

      expect(db.Evaluations.create).toHaveBeenCalledWith({
        studentId: 1,
        assigmentId: 2,
        teachingBlockId: 3,
        score: 18.5,
        type: 'Examen',
        status: true,
      });
      expect(res.statusCode).toBe(201);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Examen registrado correctamente.');
      expect(data).toHaveProperty('exam.id', 10);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: {
          studentId: 1,
          assigmentId: 2,
          teachingBlockId: 3,
          score: 18.5,
          type: 'Examen',
        },
      });
      const res = httpMocks.createResponse();

      db.StudentEnrollments.findByPk.mockRejectedValue(new Error('Error DB'));

      await evaluationsController.createEvaluation(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getEvaluations ----------
  describe('getEvaluations', () => {
    it('debe retornar lista de evaluaciones', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
      });
      const res = httpMocks.createResponse();

      const mockExams = [{ id: 1 }, { id: 2 }];
      db.Evaluations.findAll.mockResolvedValue(mockExams);

      await evaluationsController.getEvaluations(req, res);

      expect(db.Evaluations.findAll).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
      });
      const res = httpMocks.createResponse();

      db.Evaluations.findAll.mockRejectedValue(new Error('Error interno'));

      await evaluationsController.getEvaluations(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- updateEvaluation ----------
  describe('updateEvaluation', () => {
    it('debe retornar 404 si la evaluación no existe', async () => {
      const req = httpMocks.createRequest({
        method: 'PUT',
        params: { id: '1' },
        body: {
          studentId: 1,
          assigmentId: 2,
          teachingBlockId: 3,
          score: 20,
          examDate: '2025-01-01',
          type: 'Examen',
        },
      });
      const res = httpMocks.createResponse();

      db.Evaluations.findByPk.mockResolvedValue(null);

      await evaluationsController.updateEvaluation(req, res);

      expect(db.Evaluations.findByPk).toHaveBeenCalledWith('1');
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Evaluación no encontrada.');
    });

    it('debe actualizar la evaluación y retornar 200', async () => {
      const req = httpMocks.createRequest({
        method: 'PUT',
        params: { id: '1' },
        body: {
          studentId: 1,
          assigmentId: 2,
          teachingBlockId: 3,
          score: 17,
          examDate: '2025-02-01',
          type: 'Práctica',
        },
      });
      const res = httpMocks.createResponse();

      const mockEval = {
        id: 1,
        studentId: 10,
        assigmentId: 20,
        teachingBlockId: 30,
        score: 10,
        examDate: null,
        type: 'Examen',
        save: jest.fn().mockResolvedValue(),
      };

      db.Evaluations.findByPk.mockResolvedValue(mockEval);

      await evaluationsController.updateEvaluation(req, res);

      expect(db.Evaluations.findByPk).toHaveBeenCalledWith('1');
      expect(mockEval.studentId).toBe(1);
      expect(mockEval.assigmentId).toBe(2);
      expect(mockEval.teachingBlockId).toBe(3);
      expect(mockEval.score).toBe(17);
      expect(mockEval.examDate).toBe('2025-02-01');
      expect(mockEval.type).toBe('Práctica');
      expect(mockEval.save).toHaveBeenCalled();

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty('id', 1);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = httpMocks.createRequest({
        method: 'PUT',
        params: { id: '1' },
        body: {},
      });
      const res = httpMocks.createResponse();

      db.Evaluations.findByPk.mockRejectedValue(new Error('Error interno'));

      await evaluationsController.updateEvaluation(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- deleteEvaluation ----------
  describe('deleteEvaluation', () => {
    it('debe retornar 400 si id es inválido', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        params: { id: 'abc' },
      });
      const res = httpMocks.createResponse();

      await evaluationsController.deleteEvaluation(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Identificador inválido o no proporcionado.'
      );
    });

    it('debe retornar 404 si no se encuentra la evaluación', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      db.Evaluations.destroy.mockResolvedValue(0);

      await evaluationsController.deleteEvaluation(req, res);

      expect(db.Evaluations.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Evaluación no encontrada.');
    });

    it('debe eliminar la evaluación y retornar 200', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      db.Evaluations.destroy.mockResolvedValue(1);

      await evaluationsController.deleteEvaluation(req, res);

      expect(db.Evaluations.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Evaluación eliminada correctamente.');
    });

    it('debe manejar errores internos con 500', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      db.Evaluations.destroy.mockRejectedValue(new Error('Error interno'));

      await evaluationsController.deleteEvaluation(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getEvaluationsByStudent ----------
  describe('getEvaluationsByStudent', () => {
    it('debe retornar 400 si falta studentId', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: {},
      });
      const res = httpMocks.createResponse();

      await evaluationsController.getEvaluationsByStudent(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Se requiere el studentId en los parámetros.'
      );
    });

    it('debe retornar mensaje si no hay exámenes', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: { studentId: '1' },
      });
      const res = httpMocks.createResponse();

      db.Evaluations.findAll.mockResolvedValue([]);

      await evaluationsController.getEvaluationsByStudent(req, res);

      expect(db.Evaluations.findAll).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'El alumno no tiene registros de exámenes.'
      );
      expect(Array.isArray(data.exams)).toBe(true);
      expect(data.exams).toHaveLength(0);
    });

    it('debe retornar lista de exámenes', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: { studentId: '1' },
      });
      const res = httpMocks.createResponse();

      const mockExams = [{ id: 1 }, { id: 2 }];
      db.Evaluations.findAll.mockResolvedValue(mockExams);

      await evaluationsController.getEvaluationsByStudent(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: { studentId: '1' },
      });
      const res = httpMocks.createResponse();

      db.Evaluations.findAll.mockRejectedValue(new Error('Error interno'));

      await evaluationsController.getEvaluationsByStudent(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getEvaluationsByGroupAndStudent ----------
  describe('getEvaluationsByGroupAndStudent', () => {
    it('debe retornar 400 si falta studentId', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: { assigmentId: '2' },
      });
      const res = httpMocks.createResponse();

      await evaluationsController.getEvaluationsByGroupAndStudent(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'El parámetro studentId es obligatorio.'
      );
    });

    it('debe retornar mensaje si no hay exámenes', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: { studentId: '1', assigmentId: '2' },
      });
      const res = httpMocks.createResponse();

      db.Evaluations.findAll.mockResolvedValue([]);

      await evaluationsController.getEvaluationsByGroupAndStudent(req, res);

      expect(db.Evaluations.findAll).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'El alumno no tiene exámenes registrados en este grupo docente.'
      );
      expect(Array.isArray(data.exams)).toBe(true);
      expect(data.exams).toHaveLength(0);
    });

    it('debe retornar exámenes y mensaje de éxito', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: { studentId: '1', assigmentId: '2' },
      });
      const res = httpMocks.createResponse();

      const mockExams = [{ id: 1 }, { id: 2 }];
      db.Evaluations.findAll.mockResolvedValue(mockExams);

      await evaluationsController.getEvaluationsByGroupAndStudent(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Exámenes obtenidos correctamente.'
      );
      expect(Array.isArray(data.exams)).toBe(true);
      expect(data.exams).toHaveLength(2);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: { studentId: '1', assigmentId: '2' },
      });
      const res = httpMocks.createResponse();

      db.Evaluations.findAll.mockRejectedValue(new Error('Error interno'));

      await evaluationsController.getEvaluationsByGroupAndStudent(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error al obtener los exámenes por alumno y grupo docente.'
      );
    });
  });

  // ---------- getEvaluationsByBlockAndGroup ----------
  describe('getEvaluationsByBlockAndGroup', () => {
    it('debe retornar 400 si falta teachingBlockId', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: { assigmentId: '2' },
      });
      const res = httpMocks.createResponse();

      await evaluationsController.getEvaluationsByBlockAndGroup(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'El parámetro teachingBlockId es obligatorio.'
      );
    });

    it('debe retornar mensaje si no hay exámenes', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: { teachingBlockId: '1', assigmentId: '2' },
      });
      const res = httpMocks.createResponse();

      db.Evaluations.findAll.mockResolvedValue([]);

      await evaluationsController.getEvaluationsByBlockAndGroup(req, res);

      expect(db.Evaluations.findAll).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'El alumno no tiene exámenes registrados en este grupo docente.'
      );
      expect(Array.isArray(data.exams)).toBe(true);
      expect(data.exams).toHaveLength(0);
    });

    it('debe retornar exámenes y mensaje de éxito', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: { teachingBlockId: '1', assigmentId: '2' },
      });
      const res = httpMocks.createResponse();

      const mockExams = [{ id: 1 }, { id: 2 }];
      db.Evaluations.findAll.mockResolvedValue(mockExams);

      await evaluationsController.getEvaluationsByBlockAndGroup(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Exámenes obtenidos correctamente.'
      );
      expect(Array.isArray(data.exams)).toBe(true);
      expect(data.exams).toHaveLength(2);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        params: { teachingBlockId: '1', assigmentId: '2' },
      });
      const res = httpMocks.createResponse();

      db.Evaluations.findAll.mockRejectedValue(new Error('Error interno'));

      await evaluationsController.getEvaluationsByBlockAndGroup(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });
});
