// test/unit.test/qualifications.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/qualifications.controller');
const db = require('../../models');
const { Op } = require('sequelize');

jest.mock('sequelize', () => {
  const actual = jest.requireActual('sequelize');
  return {
    ...actual,
    Op: {
      in: 'IN',
    },
  };
});

jest.mock('../../models', () => ({
  sequelize: {
    transaction: jest.fn(),
  },
  Qualifications: {
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  StudentEnrollments: {},
  Persons: {},
  Schedules: {},
  Years: {},
  SchoolDays: {},
  TeacherGroups: {
    findByPk: jest.fn(),
  },
}));

describe('Qualifications Controller - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- bulkCreateQualifications ----------
  describe('bulkCreateQualifications', () => {
    it('debe retornar 400 si no se envía un array o está vacío', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/qualifications/bulkCreate',
        body: [], // vacío
      });
      const res = httpMocks.createResponse();

      await controller.bulkCreateQualifications(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'No se enviaron calificaciones.');
      expect(db.Qualifications.bulkCreate).not.toHaveBeenCalled();
    });

    it('debe normalizar rating null/""/undefined a 0 y crear registros', async () => {
      db.Qualifications.bulkCreate.mockResolvedValue(true);

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/qualifications/bulkCreate',
        body: [
          { studentId: 1, scheduleId: 1, schoolDayId: 1, rating: null },
          { studentId: 2, scheduleId: 1, schoolDayId: 1, rating: '' },
          { studentId: 3, scheduleId: 1, schoolDayId: 1 }, // undefined
        ],
      });
      const res = httpMocks.createResponse();

      await controller.bulkCreateQualifications(req, res);

      expect(db.Qualifications.bulkCreate).toHaveBeenCalledWith([
        { studentId: 1, scheduleId: 1, schoolDayId: 1, rating: 0 },
        { studentId: 2, scheduleId: 1, schoolDayId: 1, rating: 0 },
        { studentId: 3, scheduleId: 1, schoolDayId: 1, rating: 0 },
      ]);

      expect(res.statusCode).toBe(201);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Calificaciones registradas correctamente.'
      );
    });

    it('debe manejar error interno con 500', async () => {
      db.Qualifications.bulkCreate.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/qualifications/bulkCreate',
        body: [
          { studentId: 1, scheduleId: 1, schoolDayId: 1, rating: 10 },
        ],
      });
      const res = httpMocks.createResponse();

      await controller.bulkCreateQualifications(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getQualifications ----------
  describe('getQualifications', () => {
    it('debe retornar lista de calificaciones (200)', async () => {
      const mockList = [{ id: 1 }, { id: 2 }];
      db.Qualifications.findAll.mockResolvedValue(mockList);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/qualifications/list',
      });
      const res = httpMocks.createResponse();

      await controller.getQualifications(req, res);

      expect(db.Qualifications.findAll).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockList);
    });

    it('debe manejar error interno con 500', async () => {
      db.Qualifications.findAll.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/qualifications/list',
      });
      const res = httpMocks.createResponse();

      await controller.getQualifications(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- bulkUpdateQualifications ----------
  describe('bulkUpdateQualifications', () => {
    it('debe retornar 400 si no hay datos para actualizar', async () => {
      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/qualifications/bulkUpdate',
        body: [],
      });
      const res = httpMocks.createResponse();

      await controller.bulkUpdateQualifications(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'No hay datos para actualizar'
      );
      expect(db.sequelize.transaction).not.toHaveBeenCalled();
    });

    it('debe retornar 500 si algún registro no tiene id', async () => {
      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/qualifications/bulkUpdate',
        body: [
          {
            studentId: 1,
            scheduleId: 1,
            schoolDayId: 1,
            rating: 10,
          }, // sin id
        ],
      });
      const res = httpMocks.createResponse();

      db.sequelize.transaction.mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
      });

      await controller.bulkUpdateQualifications(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });

    it('debe actualizar múltiples registros dentro de una transacción', async () => {
      const commit = jest.fn();
      const rollback = jest.fn();
      db.sequelize.transaction.mockResolvedValue({
        commit,
        rollback,
      });

      db.Qualifications.update.mockResolvedValue([1]);

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/qualifications/bulkUpdate',
        body: [
          {
            id: 1,
            studentId: 1,
            scheduleId: 1,
            schoolDayId: 1,
            rating: null,
            ratingDetail: 'Obs 1',
          },
          {
            id: 2,
            studentId: 2,
            scheduleId: 1,
            schoolDayId: 1,
            rating: 15,
          },
        ],
      });
      const res = httpMocks.createResponse();

      await controller.bulkUpdateQualifications(req, res);

      // Se debe normalizar rating de null a 0
      expect(db.Qualifications.update).toHaveBeenNthCalledWith(
        1,
        {
          rating: 0,
          ratingDetail: 'Obs 1',
          scheduleId: 1,
          schoolDayId: 1,
          studentId: 1,
        },
        {
          where: { id: 1 },
          transaction: expect.anything(),
        }
      );
      expect(db.Qualifications.update).toHaveBeenNthCalledWith(
        2,
        {
          rating: 15,
          ratingDetail: '',
          scheduleId: 1,
          schoolDayId: 1,
          studentId: 2,
        },
        {
          where: { id: 2 },
          transaction: expect.anything(),
        }
      );

      expect(commit).toHaveBeenCalled();
      expect(rollback).not.toHaveBeenCalled();

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Calificaciones actualizadas correctamente'
      );
      expect(data).toHaveProperty('status', true);
    });

    it('debe hacer rollback y retornar 500 si ocurre un error dentro de la transacción', async () => {
      const commit = jest.fn();
      const rollback = jest.fn();
      db.sequelize.transaction.mockResolvedValue({
        commit,
        rollback,
      });

      db.Qualifications.update.mockRejectedValue(
        new Error('Error update')
      );

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/qualifications/bulkUpdate',
        body: [
          {
            id: 1,
            studentId: 1,
            scheduleId: 1,
            schoolDayId: 1,
            rating: 10,
          },
        ],
      });
      const res = httpMocks.createResponse();

      await controller.bulkUpdateQualifications(req, res);

      expect(rollback).toHaveBeenCalled();
      expect(commit).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getQualificationsByScheduleAndDay ----------
  describe('getQualificationsByScheduleAndDay', () => {
    it('debe retornar 400 si faltan scheduleId o schoolDayId', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/qualifications/byScheduleAndDay',
        query: { scheduleId: 1 }, // falta schoolDayId
      });
      const res = httpMocks.createResponse();

      await controller.getQualificationsByScheduleAndDay(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Faltan parámetros: scheduleId y schoolDayId son requeridos'
      );
      expect(db.Qualifications.findAll).not.toHaveBeenCalled();
    });

    it('debe retornar 200 con calificaciones filtradas', async () => {
      const mockList = [{ id: 1 }];
      db.Qualifications.findAll.mockResolvedValue(mockList);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/qualifications/byScheduleAndDay',
        query: { scheduleId: 1, schoolDayId: 2 },
      });
      const res = httpMocks.createResponse();

      await controller.getQualificationsByScheduleAndDay(req, res);

      expect(db.Qualifications.findAll).toHaveBeenCalledWith({
        where: { scheduleId: 1, schoolDayId: 2 },
        include: expect.any(Array),
        order: [['id', 'ASC']],
      });

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockList);
    });

    it('debe manejar error interno con 500', async () => {
      db.Qualifications.findAll.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/qualifications/byScheduleAndDay',
        query: { scheduleId: 1, schoolDayId: 2 },
      });
      const res = httpMocks.createResponse();

      await controller.getQualificationsByScheduleAndDay(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getQualificationsByScheduleAndStudent ----------
  describe('getQualificationsByScheduleAndStudent', () => {
    it('debe retornar 200 con calificaciones por estudiante y horario', async () => {
      const mockList = [{ id: 1, studentId: 1, scheduleId: 1 }];
      db.Qualifications.findAll.mockResolvedValue(mockList);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/qualifications/byStudent/1/schedule/1',
        params: { studentId: '1', scheduleId: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.getQualificationsByScheduleAndStudent(req, res);

      expect(db.Qualifications.findAll).toHaveBeenCalledWith({
        where: { studentId: '1', scheduleId: '1' },
        include: expect.any(Array),
        order: [['schoolDayId', 'ASC']],
      });

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockList);
    });

    it('debe manejar error interno con 500', async () => {
      db.Qualifications.findAll.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/qualifications/byStudent/1/schedule/1',
        params: { studentId: '1', scheduleId: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.getQualificationsByScheduleAndStudent(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getQualificationsByGroupAndStudent ----------
  describe('getQualificationsByGroupAndStudent', () => {
    it('debe retornar 404 si el grupo de docente no existe', async () => {
      db.TeacherGroups.findByPk.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/qualifications/by-group/1/student/1',
        params: { teacherGroupId: '1', studentId: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.getQualificationsByGroupAndStudent(req, res);

      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Grupo de docente no encontrado'
      );
      expect(db.Qualifications.findAll).not.toHaveBeenCalled();
    });

    it('debe retornar 404 si no hay schedules para el grupo', async () => {
      db.TeacherGroups.findByPk.mockResolvedValue({
        id: 1,
        courseId: 1,
        gradeId: 1,
        sectionId: 1,
        yearId: 1,
      });
      db.Schedules = {
        findAll: jest.fn().mockResolvedValue([]),
      };

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/qualifications/by-group/1/student/1',
        params: { teacherGroupId: '1', studentId: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.getQualificationsByGroupAndStudent(req, res);

      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'No se encontraron horarios para este grupo'
      );
    });

    it('debe retornar 200 con calificaciones si hay schedules y datos', async () => {
      db.TeacherGroups.findByPk.mockResolvedValue({
        id: 1,
        courseId: 1,
        gradeId: 1,
        sectionId: 1,
        yearId: 1,
      });

      db.Schedules = {
        findAll: jest.fn().mockResolvedValue([
          { id: 10 },
          { id: 11 },
        ]),
      };

      const mockList = [{ id: 1 }];
      db.Qualifications.findAll.mockResolvedValue(mockList);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/qualifications/by-group/1/student/1',
        params: { teacherGroupId: '1', studentId: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.getQualificationsByGroupAndStudent(req, res);

      expect(db.Schedules.findAll).toHaveBeenCalled();
      expect(db.Qualifications.findAll).toHaveBeenCalledWith({
        where: {
          studentId: '1',
          scheduleId: { [Op.in]: [10, 11] },
          status: true,
        },
        include: expect.any(Array),
        order: [['createdAt', 'ASC']],
      });

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockList);
    });

    it('debe manejar error interno con 500', async () => {
      db.TeacherGroups.findByPk.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/qualifications/by-group/1/student/1',
        params: { teacherGroupId: '1', studentId: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.getQualificationsByGroupAndStudent(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });
});
