// test/unit.test/attendances.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/attendances.controller');
const db = require('../../models');
const { Op } = require('sequelize');

jest.mock('../../models', () => ({
  Attendances: {
    bulkCreate: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  },
  StudentEnrollments: {},
  Schedules: {
    findAll: jest.fn(),
  },
  SchoolDays: {},
  TeacherGroups: {
    findByPk: jest.fn(),
  },
  Persons: {},
  Grades: {},
  Sections: {},
  Years: {},
  sequelize: {
    transaction: jest.fn(),
  },
}));

describe('Attendances Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- bulkCreateAttendances ----------
  it('bulkCreateAttendances debe retornar 400 si no se envían asistencias', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: [],
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateAttendances(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.message).toMatch(/No se enviaron asistencias/i);
  });

  it('bulkCreateAttendances debe registrar asistencias y devolver 201', async () => {
    db.Attendances.bulkCreate.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: [
        {
          studentId: 1,
          scheduleId: 1,
          schoolDayId: 1,
          assistance: 'P',
        },
      ],
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateAttendances(req, res);

    expect(db.Attendances.bulkCreate).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Asistencias registradas correctamente/i);
  });

  it('bulkCreateAttendances debe manejar error 500', async () => {
    db.Attendances.bulkCreate.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: [
        {
          studentId: 1,
          scheduleId: 1,
          schoolDayId: 1,
          assistance: 'P',
        },
      ],
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateAttendances(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- bulkUpdateAttendances ----------
  it('bulkUpdateAttendances debe retornar 400 si no hay datos para actualizar', async () => {
    const req = httpMocks.createRequest({
      method: 'PUT',
      body: [],
    });
    const res = httpMocks.createResponse();

    await controller.bulkUpdateAttendances(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.status).toBe(false);
  });

  it('bulkUpdateAttendances debe actualizar registros y devolver status true', async () => {
    const commit = jest.fn().mockResolvedValue();
    const rollback = jest.fn().mockResolvedValue();

    db.sequelize.transaction.mockResolvedValue({ commit, rollback });
    db.Attendances.update.mockResolvedValue([1]);

    const req = httpMocks.createRequest({
      method: 'PUT',
      body: [
        {
          id: 1,
          studentId: 1,
          scheduleId: 1,
          schoolDayId: 1,
          assistance: 'P',
          assistanceDetail: 'OK',
        },
        {
          id: 2,
          studentId: 2,
          scheduleId: 1,
          schoolDayId: 1,
          assistance: 'F',
        },
      ],
    });
    const res = httpMocks.createResponse();

    await controller.bulkUpdateAttendances(req, res);

    expect(db.sequelize.transaction).toHaveBeenCalled();
    expect(db.Attendances.update).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalled();
    const data = res._getJSONData();
    expect(data.status).toBe(true);
    expect(data.message).toMatch(/actualizadas correctamente/i);
  });

  it('bulkUpdateAttendances debe retornar 500 si ocurre error en la transacción', async () => {
    const commit = jest.fn();
    const rollback = jest.fn().mockResolvedValue();

    db.sequelize.transaction.mockResolvedValue({ commit, rollback });

    db.Attendances.update.mockImplementation(() => {
      throw new Error('Error en update');
    });

    const req = httpMocks.createRequest({
      method: 'PUT',
      body: [
        {
          id: 1,
          studentId: 1,
          scheduleId: 1,
          schoolDayId: 1,
          assistance: 'P',
        },
      ],
    });
    const res = httpMocks.createResponse();

    await controller.bulkUpdateAttendances(req, res);

    expect(rollback).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
  });

  // ---------- getAttendancesByScheduleAndDay ----------
  it('getAttendancesByScheduleAndDay debe retornar 400 si faltan parámetros', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      query: { scheduleId: '', schoolDayId: '' },
    });
    const res = httpMocks.createResponse();

    await controller.getAttendancesByScheduleAndDay(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.status).toBe(false);
  });

  it('getAttendancesByScheduleAndDay debe retornar 200 con lista de asistencias', async () => {
    db.Attendances.findAll.mockResolvedValue([
      { id: 1, studentId: 1, scheduleId: 1, schoolDayId: 1, assistance: 'P' },
    ]);

    const req = httpMocks.createRequest({
      method: 'GET',
      query: { scheduleId: '1', schoolDayId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAttendancesByScheduleAndDay(req, res);

    expect(db.Attendances.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
  });

  it('getAttendancesByScheduleAndDay debe manejar error 500', async () => {
    db.Attendances.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      query: { scheduleId: '1', schoolDayId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAttendancesByScheduleAndDay(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getAttendancesByScheduleAndStudent ----------
  it('getAttendancesByScheduleAndStudent debe retornar 200 con mensaje si no hay asistencias', async () => {
    db.Attendances.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '1', scheduleId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAttendancesByScheduleAndStudent(req, res);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.message).toMatch(/No se encontraron asistencias/i);
  });

  it('getAttendancesByScheduleAndStudent debe retornar 200 con asistencias', async () => {
    db.Attendances.findAll.mockResolvedValue([
      { id: 1, studentId: 1, scheduleId: 1, schoolDayId: 1, assistance: 'P' },
    ]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '1', scheduleId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAttendancesByScheduleAndStudent(req, res);

    expect(db.Attendances.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
  });

  it('getAttendancesByScheduleAndStudent debe manejar error 500', async () => {
    db.Attendances.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '1', scheduleId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAttendancesByScheduleAndStudent(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getAttendancesByGroupAndStudent ----------
  it('getAttendancesByGroupAndStudent debe retornar 404 si no existe grupo de docente', async () => {
    db.TeacherGroups.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { teacherGroupId: '1', studentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAttendancesByGroupAndStudent(req, res);

    expect(db.TeacherGroups.findByPk).toHaveBeenCalledWith('1');
    expect(res.statusCode).toBe(404);
  });

  it('getAttendancesByGroupAndStudent debe retornar 404 si no hay horarios', async () => {
    db.TeacherGroups.findByPk.mockResolvedValue({
      id: 1,
      courseId: 1,
      gradeId: 1,
      sectionId: 1,
      yearId: 2024,
    });

    db.Schedules.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { teacherGroupId: '1', studentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAttendancesByGroupAndStudent(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toMatch(/No se encontraron horarios/i);
  });

  it('getAttendancesByGroupAndStudent debe retornar 200 con asistencias', async () => {
    db.TeacherGroups.findByPk.mockResolvedValue({
      id: 1,
      courseId: 1,
      gradeId: 1,
      sectionId: 1,
      yearId: 2024,
    });

    db.Schedules.findAll.mockResolvedValue([
      { id: 10 },
      { id: 11 },
    ]);

    db.Attendances.findAll.mockResolvedValue([
      {
        id: 1,
        studentId: 1,
        scheduleId: 10,
        assistance: 'P',
      },
    ]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { teacherGroupId: '1', studentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAttendancesByGroupAndStudent(req, res);

    expect(db.Attendances.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
  });

  it('getAttendancesByGroupAndStudent debe manejar error 500', async () => {
    db.TeacherGroups.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { teacherGroupId: '1', studentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAttendancesByGroupAndStudent(req, res);

    expect(res.statusCode).toBe(500);
  });
});
