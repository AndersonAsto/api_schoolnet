// test/unit.test/schoolDays.unit.test.js
const httpMocks = require('node-mocks-http');
const schoolDaysController = require('../../controllers/schoolDays.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  SchoolDays: {
    findOne: jest.fn(),
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
  },
  Years: {},
}));

describe('SchoolDays Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- bulkCreateSchoolDays ----------
  it('bulkCreateSchoolDays debe retornar 400 si datos son inválidos', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: null,
        teachingDay: [],
      },
    });
    const res = httpMocks.createResponse();

    await schoolDaysController.bulkCreateSchoolDays(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Datos inválidos.');
    expect(db.SchoolDays.findOne).not.toHaveBeenCalled();
  });

  it('bulkCreateSchoolDays debe retornar 409 si ya existen días lectivos para ese año', async () => {
    db.SchoolDays.findOne.mockResolvedValue({ id: 1, yearId: 1 });

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        teachingDay: ['2025-03-01', '2025-03-02'],
      },
    });
    const res = httpMocks.createResponse();

    await schoolDaysController.bulkCreateSchoolDays(req, res);

    expect(db.SchoolDays.findOne).toHaveBeenCalledWith({ where: { yearId: 1 } });
    expect(res.statusCode).toBe(409);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Los días lectivos para este año ya existen.'
    );
    expect(db.SchoolDays.bulkCreate).not.toHaveBeenCalled();
  });

  it('bulkCreateSchoolDays debe crear días lectivos y retornar 201', async () => {
    db.SchoolDays.findOne.mockResolvedValue(null);
    db.SchoolDays.bulkCreate.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        teachingDay: ['2025-03-03', '2025-03-04'],
      },
    });
    const res = httpMocks.createResponse();

    await schoolDaysController.bulkCreateSchoolDays(req, res);

    expect(db.SchoolDays.findOne).toHaveBeenCalledWith({ where: { yearId: 1 } });
    expect(db.SchoolDays.bulkCreate).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Días lectivos registrados correctamente.'
    );
  });

  it('bulkCreateSchoolDays debe manejar error 500', async () => {
    db.SchoolDays.findOne.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        teachingDay: ['2025-03-03'],
      },
    });
    const res = httpMocks.createResponse();

    await schoolDaysController.bulkCreateSchoolDays(req, res);

    expect(res.statusCode).toBe(500);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Error interno del servidor. Inténtelo de nuevo más tarde.'
    );
  });

  // ---------- getSchoolDays ----------
  it('getSchoolDays debe retornar lista de días lectivos', async () => {
    db.SchoolDays.findAll.mockResolvedValue([
      { id: 1, teachingDay: '2025-03-01' },
      { id: 2, teachingDay: '2025-03-02' },
    ]);

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await schoolDaysController.getSchoolDays(req, res);

    expect(db.SchoolDays.findAll).toHaveBeenCalledWith({
      include: {
        model: db.Years,
        as: 'years',
        attributes: ['id', 'year', 'status'],
      },
    });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
  });

  it('getSchoolDays debe manejar error 500', async () => {
    db.SchoolDays.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await schoolDaysController.getSchoolDays(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getSchoolDaysByYear ----------
  it('getSchoolDaysByYear debe retornar 400 si falta yearId', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '' },
    });
    const res = httpMocks.createResponse();

    await schoolDaysController.getSchoolDaysByYear(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'El identificador del año es requerido'
    );
    expect(db.SchoolDays.findAll).not.toHaveBeenCalled();
  });

  it('getSchoolDaysByYear debe retornar lista de días lectivos', async () => {
    db.SchoolDays.findAll.mockResolvedValue([
      { id: 1, teachingDay: '2025-03-01' },
      { id: 2, teachingDay: '2025-03-02' },
    ]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await schoolDaysController.getSchoolDaysByYear(req, res);

    expect(db.SchoolDays.findAll).toHaveBeenCalledWith({
      where: { yearId: '1' },
      order: [['teachingDay', 'ASC']],
    });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
  });

  it('getSchoolDaysByYear debe manejar error 500', async () => {
    db.SchoolDays.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await schoolDaysController.getSchoolDaysByYear(req, res);

    expect(res.statusCode).toBe(500);
  });
});
