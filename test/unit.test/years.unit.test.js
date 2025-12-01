// test/unit.test/years.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/years.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  Years: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('Years Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createYear ----------
  it('createYear debe retornar 400 si no se envía year', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {},
    });
    const res = httpMocks.createResponse();

    await controller.createYear(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.error).toMatch(/No ha completado los campos requeridos/i);
  });

  it('createYear debe crear un año y devolver 201', async () => {
    const mockYear = { id: 1, year: 2025 };
    db.Years.create.mockResolvedValue(mockYear);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { year: 2025 },
    });
    const res = httpMocks.createResponse();

    await controller.createYear(req, res);

    expect(db.Years.create).toHaveBeenCalledWith({ year: 2025 });
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data.year).toBe(2025);
  });

  it('createYear debe manejar error 500', async () => {
    db.Years.create.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { year: 2025 },
    });
    const res = httpMocks.createResponse();

    await controller.createYear(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getYears ----------
  it('getYears debe retornar listado de años', async () => {
    db.Years.findAll.mockResolvedValue([{ id: 1, year: 2024 }]);

    const req = httpMocks.createRequest({
      method: 'GET',
    });
    const res = httpMocks.createResponse();

    await controller.getYears(req, res);

    expect(db.Years.findAll).toHaveBeenCalledWith({
      order: [['year', 'ASC']],
    });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
  });

  it('getYears debe manejar error 500', async () => {
    db.Years.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
    });
    const res = httpMocks.createResponse();

    await controller.getYears(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- updateYear ----------
  it('updateYear debe retornar 404 si el año no existe', async () => {
    db.Years.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { year: 2030 },
    });
    const res = httpMocks.createResponse();

    await controller.updateYear(req, res);

    expect(db.Years.findByPk).toHaveBeenCalledWith('1');
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Año no encontrado/i);
  });

  it('updateYear debe actualizar el año y devolver 200', async () => {
    const mockYear = {
      id: 1,
      year: 2025,
      save: jest.fn().mockResolvedValue(),
    };
    db.Years.findByPk.mockResolvedValue(mockYear);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { year: 2030 },
    });
    const res = httpMocks.createResponse();

    await controller.updateYear(req, res);

    expect(mockYear.year).toBe(2030);
    expect(mockYear.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.year).toBe(2030);
  });

  it('updateYear debe manejar error 500', async () => {
    db.Years.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { year: 2030 },
    });
    const res = httpMocks.createResponse();

    await controller.updateYear(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- deleteYear (solo comportamiento básico, sin usar en integración) ----------
  it('deleteYear debe retornar 200 si elimina', async () => {
    db.Years.destroy.mockResolvedValue(1);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteYear(req, res);

    expect(db.Years.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Año eliminado correctamente/i);
  });

  it('deleteYear debe retornar 404 si el año no existe', async () => {
    db.Years.destroy.mockResolvedValue(0);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteYear(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Año no encontrado/i);
  });

  it('deleteYear debe manejar error 500', async () => {
    db.Years.destroy.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteYear(req, res);

    expect(res.statusCode).toBe(500);
  });
});
