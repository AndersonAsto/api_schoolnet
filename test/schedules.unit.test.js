/**
 * @file test/schedules.unit.test.js
 * Pruebas unitarias de controladores de horarios (Schedules)
 */

const schedulesController = require('../controllers/schedules.controller');
const Schedules = require('../models/schedules.model');

jest.mock('../models/schedules.model', () => ({
  create: jest.fn(),
  findAll: jest.fn()
}));

describe('🧠 Schedules Controller - Unit Tests', () => {

  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  test('createSchedule → debe crear un nuevo horario (201)', async () => {
    req.body = {
      yearId: 1,
      teacherId: 2,
      courseId: 3,
      gradeId: 4,
      sectionId: 5,
      weekday: 'Martes',
      startTime: '09:00:00',
      endTime: '10:00:00'
    };

    Schedules.create.mockResolvedValue({ id: 1, ...req.body });

    await schedulesController.createSchedule(req, res);

    expect(Schedules.create).toHaveBeenCalledWith(expect.objectContaining(req.body));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  test('createSchedule → debe retornar 400 si faltan campos', async () => {
    req.body = { yearId: 1, weekday: 'Lunes' }; // faltan varios campos

    await schedulesController.createSchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getSchedules → debe retornar una lista de horarios (200)', async () => {
    Schedules.findAll.mockResolvedValue([{ id: 1, weekday: 'Lunes' }]);

    await schedulesController.getSchedules(req, res);

    expect(Schedules.findAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.any(Array));
  });

  test('getSchedules → debe retornar 500 si ocurre un error', async () => {
    Schedules.findAll.mockRejectedValue(new Error('DB error'));

    await schedulesController.getSchedules(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Error al obtener horarios')
    }));
  });

});
