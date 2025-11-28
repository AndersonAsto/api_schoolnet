// test/unit.test/schedules.unit.test.js
const httpMocks = require('node-mocks-http');
const schedulesController = require('../../controllers/schedules.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  Schedules: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  Years: {},
  Courses: {},
  Sections: {},
  Grades: {},
  TeacherAssignments: {
    findOne: jest.fn(),
  },
  Persons: {
    findByPk: jest.fn(),
  },
  Users: {
    findByPk: jest.fn(),
  },
  Sequelize: {
    literal: jest.fn((v) => v),
  },
}));

describe('Schedules Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createSchedule ----------
  it('createSchedule debe retornar 400 si faltan campos requeridos', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        // faltan varios campos
        yearId: 1,
      },
    });
    const res = httpMocks.createResponse();

    await schedulesController.createSchedule(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'No ha completado los campos requeridos:');
    expect(db.Schedules.create).not.toHaveBeenCalled();
  });

  it('createSchedule debe crear un horario y retornar 201', async () => {
    const body = {
      yearId: 1,
      teacherId: 2,
      courseId: 3,
      gradeId: 4,
      sectionId: 5,
      weekday: 'Lunes',
      startTime: '08:00:00',
      endTime: '09:00:00',
    };

    db.Schedules.create.mockResolvedValue({
      id: 10,
      ...body,
      status: true,
    });

    const req = httpMocks.createRequest({
      method: 'POST',
      body,
    });
    const res = httpMocks.createResponse();

    await schedulesController.createSchedule(req, res);

    expect(db.Schedules.create).toHaveBeenCalledWith(body);
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data).toMatchObject({
      id: 10,
      teacherId: 2,
      weekday: 'Lunes',
    });
  });

  it('createSchedule debe manejar error interno con 500', async () => {
    db.Schedules.create.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        teacherId: 2,
        courseId: 3,
        gradeId: 4,
        sectionId: 5,
        weekday: 'Lunes',
        startTime: '08:00:00',
        endTime: '09:00:00',
      },
    });
    const res = httpMocks.createResponse();

    await schedulesController.createSchedule(req, res);

    expect(res.statusCode).toBe(500);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Error interno del servidor. Inténtelo de nuevo más tarde.'
    );
  });

  // ---------- getSchedules ----------
  it('getSchedules debe retornar lista de horarios', async () => {
    db.Schedules.findAll.mockResolvedValue([
      { id: 1, weekday: 'Lunes' },
      { id: 2, weekday: 'Martes' },
    ]);

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await schedulesController.getSchedules(req, res);

    expect(db.Schedules.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toHaveLength(2);
  });

  it('getSchedules debe manejar error interno', async () => {
    db.Schedules.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await schedulesController.getSchedules(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- updateSchedule ----------
  it('updateSchedule debe retornar 404 si no encuentra el horario', async () => {
    db.Schedules.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        yearId: 1,
        teacherId: 2,
        courseId: 3,
        gradeId: 4,
        sectionId: 5,
        weekday: 'Lunes',
        startTime: '08:00:00',
        endTime: '09:00:00',
      },
    });
    const res = httpMocks.createResponse();

    await schedulesController.updateSchedule(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Horario no encontrado.');
  });

  it('updateSchedule debe actualizar el horario y retornar 200', async () => {
    const mockSchedule = {
      id: 1,
      yearId: 1,
      teacherId: 2,
      courseId: 3,
      gradeId: 4,
      sectionId: 5,
      weekday: 'Lunes',
      startTime: '08:00:00',
      endTime: '09:00:00',
      save: jest.fn(),
    };

    db.Schedules.findByPk.mockResolvedValue(mockSchedule);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        yearId: 2,
        teacherId: 3,
        courseId: 4,
        gradeId: 5,
        sectionId: 6,
        weekday: 'Martes',
        startTime: '09:00:00',
        endTime: '10:00:00',
      },
    });
    const res = httpMocks.createResponse();

    await schedulesController.updateSchedule(req, res);

    expect(mockSchedule.yearId).toBe(2);
    expect(mockSchedule.weekday).toBe('Martes');
    expect(mockSchedule.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.teacherId).toBe(3);
  });

  it('updateSchedule debe manejar error 500', async () => {
    db.Schedules.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        yearId: 1,
        teacherId: 2,
        courseId: 3,
        gradeId: 4,
        sectionId: 5,
        weekday: 'Lunes',
        startTime: '08:00:00',
        endTime: '09:00:00',
      },
    });
    const res = httpMocks.createResponse();

    await schedulesController.updateSchedule(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- deleteSchedule ----------
  it('deleteSchedule debe retornar 400 si id es inválido', async () => {
    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: 'abc' },
    });
    const res = httpMocks.createResponse();

    await schedulesController.deleteSchedule(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Identificador inválido o no proporcionado.'
    );
    expect(db.Schedules.destroy).not.toHaveBeenCalled();
  });

  it('deleteSchedule debe retornar 404 si no encontró registro', async () => {
    db.Schedules.destroy.mockResolvedValue(0);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await schedulesController.deleteSchedule(req, res);

    expect(db.Schedules.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Horario no encontrado.');
  });

  it('deleteSchedule debe eliminar y retornar 200', async () => {
    db.Schedules.destroy.mockResolvedValue(1);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await schedulesController.deleteSchedule(req, res);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Horario eliminado correctamente.');
  });

  // ---------- getSchedulesByUser ----------
  it('getSchedulesByUser debe retornar 404 si usuario no existe', async () => {
    db.Users.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { userId: '1' },
    });
    const res = httpMocks.createResponse();

    await schedulesController.getSchedulesByUser(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('error', 'Usuario no encontrado');
  });

  it('getSchedulesByUser debe retornar lista de horarios', async () => {
    db.Users.findByPk.mockResolvedValue({ id: 1, personId: 10 });
    db.Persons.findByPk.mockResolvedValue({ id: 10 });
    db.TeacherAssignments.findOne.mockResolvedValue({ id: 5 });
    db.Schedules.findAll.mockResolvedValue([
      { id: 1, weekday: 'Lunes' },
      { id: 2, weekday: 'Martes' },
    ]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { userId: '1' },
    });
    const res = httpMocks.createResponse();

    await schedulesController.getSchedulesByUser(req, res);

    expect(db.Schedules.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toHaveLength(2);
  });

  // ---------- getSchedulesByYearAndUser ----------
  it('getSchedulesByYearAndUser debe retornar 400 si faltan params', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { userId: '1', yearId: '' },
    });
    const res = httpMocks.createResponse();

    await schedulesController.getSchedulesByYearAndUser(req, res);

    expect(res.statusCode).toBe(400);
  });

  // ---------- getSchedulesByTeacher ----------
  it('getSchedulesByTeacher debe retornar 404 si docente no existe', async () => {
    db.Users.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { teacherId: '99' },
    });
    const res = httpMocks.createResponse();

    await schedulesController.getSchedulesByTeacher(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'error',
      'Asignación de docente no encontrada'
    );
  });

  // ---------- getSchedulesByYear ----------
  it('getSchedulesByYear debe retornar 200 con lista', async () => {
    db.Schedules.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await schedulesController.getSchedulesByYear(req, res);

    expect(db.Schedules.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toHaveLength(2);
  });
});
