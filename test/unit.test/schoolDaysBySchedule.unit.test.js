// test/unit.test/schoolDaysBySchedule.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/schoolDaysBySchedule.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  sequelize: {
    transaction: jest.fn(),
  },
  Schedules: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
  SchoolDays: {
    findAll: jest.fn(),
  },
  TeachingBlocks: {
    findAll: jest.fn(),
  },
  SchoolDaysBySchedule: {
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
  },
  Users: {
    findByPk: jest.fn(),
  },
  Years: {},
}));

describe('SchoolDaysBySchedule Controller - Unit tests', () => {
  let commitMock;
  let rollbackMock;

  beforeEach(() => {
    commitMock = jest.fn();
    rollbackMock = jest.fn();
    db.sequelize.transaction.mockResolvedValue({
      commit: commitMock,
      rollback: rollbackMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- bulkCreateSchoolDaysByYearAndSchedule ----------
  it('bulkCreateSchoolDaysByYearAndSchedule debe retornar 400 si falta yearId o scheduleId', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: null,
        scheduleId: null,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndSchedule(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Debe proporcionar yearId y scheduleId'
    );
    expect(db.Schedules.findByPk).not.toHaveBeenCalled();
  });

  it('bulkCreateSchoolDaysByYearAndSchedule debe retornar 404 si el horario no existe', async () => {
    db.Schedules.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        scheduleId: 10,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndSchedule(req, res);

    expect(db.Schedules.findByPk).toHaveBeenCalledWith(10);
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Horario no encontrado');
    expect(commitMock).not.toHaveBeenCalled();
  });

  it('bulkCreateSchoolDaysByYearAndSchedule debe retornar 400 si el horario no tiene weekday', async () => {
    db.Schedules.findByPk.mockResolvedValue({ id: 10, weekday: null });

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        scheduleId: 10,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndSchedule(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'El horario no tiene asignado un día de la semana'
    );
  });

  it('bulkCreateSchoolDaysByYearAndSchedule debe retornar 404 si no hay días escolares', async () => {
    db.Schedules.findByPk.mockResolvedValue({ id: 10, weekday: 'Lunes' });
    db.SchoolDays.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        scheduleId: 10,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndSchedule(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toMatch(/No se encontraron días escolares/);
  });

  it('bulkCreateSchoolDaysByYearAndSchedule debe retornar 404 si no hay bloques lectivos', async () => {
    db.Schedules.findByPk.mockResolvedValue({ id: 10, weekday: 'Lunes' });
    db.SchoolDays.findAll.mockResolvedValue([{ id: 1, teachingDay: '2025-03-01' }]);
    db.TeachingBlocks.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        scheduleId: 10,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndSchedule(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'No hay bloques lectivos definidos para este año'
    );
  });

  it('bulkCreateSchoolDaysByYearAndSchedule debe crear registros y retornar 201', async () => {
    db.Schedules.findByPk.mockResolvedValue({ id: 10, weekday: 'Lunes' });
    db.SchoolDays.findAll.mockResolvedValue([
      { id: 1, teachingDay: '2025-03-03' },
      { id: 2, teachingDay: '2025-03-10' },
    ]);
    db.TeachingBlocks.findAll.mockResolvedValue([
      { id: 100, startDay: '2025-03-01', endDay: '2025-03-31' },
    ]);
    db.SchoolDaysBySchedule.bulkCreate.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        scheduleId: 10,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndSchedule(req, res);

    expect(db.SchoolDaysBySchedule.bulkCreate).toHaveBeenCalled();
    expect(commitMock).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('registros');
    expect(Array.isArray(data.registros)).toBe(true);
  });

  it('bulkCreateSchoolDaysByYearAndSchedule debe manejar error 500', async () => {
    db.Schedules.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        scheduleId: 10,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndSchedule(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getSchoolDaysBySchedule ----------
  it('getSchoolDaysBySchedule debe devolver lista filtrada', async () => {
    db.SchoolDaysBySchedule.findAll.mockResolvedValue([
      { id: 1 },
      { id: 2 },
    ]);

    const req = httpMocks.createRequest({
      method: 'GET',
      query: { yearId: '1', scheduleId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getSchoolDaysBySchedule(req, res);

    expect(db.SchoolDaysBySchedule.findAll).toHaveBeenCalledWith({
      where: { yearId: '1', scheduleId: '10' },
      include: [
        { model: db.SchoolDays, as: 'schoolDays', attributes: ['id', 'teachingDay', 'weekday'] },
        { model: db.Years, as: 'years', attributes: ['id', 'year'] },
        { model: db.Schedules, as: 'schedules' },
        { model: db.TeachingBlocks, as: 'teachingBlocks', attributes: ['id', 'teachingBlock'] },
      ],
      order: [['id', 'ASC']],
    });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
  });

  it('getSchoolDaysBySchedule debe manejar error 500', async () => {
    db.SchoolDaysBySchedule.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      query: { yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getSchoolDaysBySchedule(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- bulkCreateSchoolDaysByYearAndTeacher ----------
  it('bulkCreateSchoolDaysByYearAndTeacher debe retornar 400 si falta yearId o teacherId', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: null,
        teacherId: null,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndTeacher(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Debe proporcionar yearId y teacherId'
    );
  });

  it('bulkCreateSchoolDaysByYearAndTeacher debe retornar 404 si el docente no existe', async () => {
    db.Users.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        teacherId: 5,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndTeacher(req, res);

    expect(db.Users.findByPk).toHaveBeenCalledWith(5);
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Docente no encontrado');
  });

  it('bulkCreateSchoolDaysByYearAndTeacher debe retornar 404 si no hay horarios', async () => {
    db.Users.findByPk.mockResolvedValue({ id: 5 });
    db.Schedules.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        teacherId: 5,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndTeacher(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'El docente no tiene horarios asignados en este año'
    );
  });

  it('bulkCreateSchoolDaysByYearAndTeacher debe retornar 404 si no hay bloques lectivos', async () => {
    db.Users.findByPk.mockResolvedValue({ id: 5 });
    db.Schedules.findAll.mockResolvedValue([{ id: 10, weekday: 'Lunes' }]);
    db.TeachingBlocks.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        teacherId: 5,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndTeacher(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'No hay bloques lectivos definidos para este año'
    );
  });

  it('bulkCreateSchoolDaysByYearAndTeacher debe crear registros y retornar 201', async () => {
    db.Users.findByPk.mockResolvedValue({ id: 5 });
    db.Schedules.findAll.mockResolvedValue([
      { id: 10, weekday: 'Lunes' },
      { id: 11, weekday: 'Martes' },
    ]);
    db.TeachingBlocks.findAll.mockResolvedValue([
      { id: 100, startDay: '2025-03-01', endDay: '2025-03-31' },
    ]);

    // SchoolDays debe devolver distintos resultados según weekday:
    db.SchoolDays.findAll.mockImplementation(({ where }) => {
      if (where.weekday === 'lunes') {
        return Promise.resolve([
          { id: 1, teachingDay: '2025-03-03' },
          { id: 2, teachingDay: '2025-03-10' },
        ]);
      }
      if (where.weekday === 'martes') {
        return Promise.resolve([
          { id: 3, teachingDay: '2025-03-04' },
          { id: 4, teachingDay: '2025-03-11' },
        ]);
      }
      return Promise.resolve([]);
    });

    db.SchoolDaysBySchedule.bulkCreate.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        teacherId: 5,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndTeacher(req, res);

    expect(db.SchoolDaysBySchedule.bulkCreate).toHaveBeenCalled();
    expect(commitMock).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data).toHaveProperty('totalHorarios', 2);
    expect(Array.isArray(data.registros)).toBe(true);
    expect(data.registros.length).toBeGreaterThan(0);
  });

  it('bulkCreateSchoolDaysByYearAndTeacher debe manejar error 500', async () => {
    db.Users.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        teacherId: 5,
      },
    });
    const res = httpMocks.createResponse();

    await controller.bulkCreateSchoolDaysByYearAndTeacher(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getDaysBySchedule ----------
  it('getDaysBySchedule debe retornar 404 si no hay registros', async () => {
    db.SchoolDaysBySchedule.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { scheduleId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getDaysBySchedule(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'No se encontraron días asociados a este horario.'
    );
  });

  it('getDaysBySchedule debe retornar lista de registros', async () => {
    db.SchoolDaysBySchedule.findAll.mockResolvedValue([
      { id: 1 },
      { id: 2 },
    ]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { scheduleId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getDaysBySchedule(req, res);

    expect(db.SchoolDaysBySchedule.findAll).toHaveBeenCalledWith({
      where: { scheduleId: '10' },
      include: [
        { model: db.SchoolDays, as: 'schoolDays', attributes: ['id', 'teachingDay', 'weekday'] },
        { model: db.Years, as: 'years', attributes: ['id', 'year'] },
        { model: db.Schedules, as: 'schedules' },
        { model: db.TeachingBlocks, as: 'teachingBlocks', attributes: ['id', 'teachingBlock'] },
      ],
      order: [[{ model: db.SchoolDays, as: 'schoolDays' }, 'teachingDay', 'ASC']],
    });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
  });

  it('getDaysBySchedule debe manejar error 500', async () => {
    db.SchoolDaysBySchedule.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { scheduleId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getDaysBySchedule(req, res);

    expect(res.statusCode).toBe(500);
  });
});
