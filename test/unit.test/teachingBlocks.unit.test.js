// test/unit.test/teachingBlocks.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/teachingBlocks.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  TeachingBlocks: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  Years: {}, // solo para que exista en los include
}));

describe('TeachingBlocks Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createTeachingBlock ----------
  it('createTeachingBlock debe retornar 400 si faltan datos obligatorios', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { yearId: 1, teachingBlock: 'Bimestre 1' }, // faltan fechas
    });
    const res = httpMocks.createResponse();

    await controller.createTeachingBlock(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Faltan datos obligatorios/);
  });

  it('createTeachingBlock debe crear y retornar 201 cuando los datos son válidos', async () => {
    const mockBlock = {
      id: 1,
      yearId: 1,
      teachingBlock: 'Bimestre 1',
      startDay: '2025-03-01',
      endDay: '2025-05-31',
    };

    db.TeachingBlocks.create.mockResolvedValue(mockBlock);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        teachingBlock: 'Bimestre 1',
        startDay: '2025-03-01',
        endDay: '2025-05-31',
      },
    });
    const res = httpMocks.createResponse();

    await controller.createTeachingBlock(req, res);

    expect(db.TeachingBlocks.create).toHaveBeenCalledWith({
      yearId: 1,
      teachingBlock: 'Bimestre 1',
      startDay: '2025-03-01',
      endDay: '2025-05-31',
    });
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data).toEqual(mockBlock);
  });

  it('createTeachingBlock debe manejar error 500', async () => {
    db.TeachingBlocks.create.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        yearId: 1,
        teachingBlock: 'Bimestre 1',
        startDay: '2025-03-01',
        endDay: '2025-05-31',
      },
    });
    const res = httpMocks.createResponse();

    await controller.createTeachingBlock(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTeachingBlocks ----------
  it('getTeachingBlocks debe retornar lista de bloques lectivos', async () => {
    db.TeachingBlocks.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const req = httpMocks.createRequest({
      method: 'GET',
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlocks(req, res);

    expect(db.TeachingBlocks.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
  });

  it('getTeachingBlocks debe manejar error 500', async () => {
    db.TeachingBlocks.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlocks(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getBlocksByYear ----------
  it('getBlocksByYear debe retornar lista filtrada por año', async () => {
    db.TeachingBlocks.findAll.mockResolvedValue([{ id: 1, yearId: 1 }]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getBlocksByYear(req, res);

    expect(db.TeachingBlocks.findAll).toHaveBeenCalledWith({
      where: { yearId: '1' },
    });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
  });

  it('getBlocksByYear debe manejar error 500', async () => {
    db.TeachingBlocks.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getBlocksByYear(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- updateTeachingBlock ----------
  it('updateTeachingBlock debe retornar 404 si el bloque no existe', async () => {
    db.TeachingBlocks.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        yearId: 1,
        teachingBlock: 'Bimestre 1',
        startDay: '2025-03-01',
        endDay: '2025-05-31',
      },
    });
    const res = httpMocks.createResponse();

    await controller.updateTeachingBlock(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toMatch(/no encontrado/i);
  });

  it('updateTeachingBlock debe actualizar y retornar 200 si existe', async () => {
    const mockBlock = {
      id: 1,
      yearId: 1,
      teachingBlock: 'Bimestre 1',
      startDay: '2025-03-01',
      endDay: '2025-05-31',
      save: jest.fn().mockResolvedValue(),
    };

    db.TeachingBlocks.findByPk.mockResolvedValue(mockBlock);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        yearId: 2,
        teachingBlock: 'Trimestre 1',
        startDay: '2025-04-01',
        endDay: '2025-06-30',
      },
    });
    const res = httpMocks.createResponse();

    await controller.updateTeachingBlock(req, res);

    expect(mockBlock.yearId).toBe(2);
    expect(mockBlock.teachingBlock).toBe('Trimestre 1');
    expect(mockBlock.startDay).toBe('2025-04-01');
    expect(mockBlock.endDay).toBe('2025-06-30');
    expect(mockBlock.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('updateTeachingBlock debe manejar error 500', async () => {
    db.TeachingBlocks.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        yearId: 2,
        teachingBlock: 'Trimestre 1',
        startDay: '2025-04-01',
        endDay: '2025-06-30',
      },
    });
    const res = httpMocks.createResponse();

    await controller.updateTeachingBlock(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- deteleTeachingBlockById ----------
  it('deteleTeachingBlockById debe retornar 200 si elimina', async () => {
    db.TeachingBlocks.destroy.mockResolvedValue(1); // 1 fila afectada

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deteleTeachingBlockById(req, res);

    expect(db.TeachingBlocks.destroy).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.message).toMatch(/eliminado correctamente/i);
  });

  it('deteleTeachingBlockById debe retornar 404 si no encuentra bloque', async () => {
    db.TeachingBlocks.destroy.mockResolvedValue(0);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deteleTeachingBlockById(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('deteleTeachingBlockById debe manejar error 500', async () => {
    db.TeachingBlocks.destroy.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deteleTeachingBlockById(req, res);

    expect(res.statusCode).toBe(500);
  });
});
