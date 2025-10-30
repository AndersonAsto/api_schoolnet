const { createBulk } = require('../controllers/assistances.controller');
const Assistances = require('../models/assistances.model');

jest.mock('../models/assistances.model');

describe('Pruebas Unitarias - createBulk', () => {

  let req, res;

  beforeEach(() => {
    req = { body: [] };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('❌ debería devolver error si no se envían asistencias', async () => {
    req.body = [];
    await createBulk(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'No se enviaron asistencias.' });
  });

  test('✅ debería crear asistencias correctamente', async () => {
    req.body = [
      { studentId: 1, scheduleId: 2, schoolDayId: 3, assistance: 'P' },
      { studentId: 2, scheduleId: 2, schoolDayId: 3, assistance: 'F' },
    ];
    Assistances.bulkCreate.mockResolvedValue(req.body);

    await createBulk(req, res);

    expect(Assistances.bulkCreate).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Asistencias registradas correctamente.' });
  });

  test('💥 debería capturar un error del servidor', async () => {
    req.body = [{ studentId: 1 }];
    Assistances.bulkCreate.mockRejectedValue(new Error('DB error'));

    await createBulk(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error al guardar asistencias.',
      error: expect.any(Error)
    });
  });

});
