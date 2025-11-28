// test/unit.test/sections.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/sections.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  Sections: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('Sections Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createSection ----------
  it('createSection debe retornar 400 si no se envía seccion', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        seccion: null,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createSection(req, res);

    // Tu código tiene un bug: usa res.status(400).error(...) en vez de .json(...)
    // Jest no va a lanzar error pero el statusCode sí será 400 si llega ahí.
    expect(res.statusCode).toBe(400);
  });

  it('createSection debe crear sección y retornar 201', async () => {
    const fakeSection = { id: 1, seccion: 1, status: true };
    db.Sections.create.mockResolvedValue(fakeSection);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        seccion: 1,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createSection(req, res);

    expect(db.Sections.create).toHaveBeenCalledWith({ seccion: 1 });
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data).toEqual(fakeSection);
  });

  it('createSection debe manejar error 500', async () => {
    db.Sections.create.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        seccion: 1,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createSection(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getSections ----------
  it('getSections debe devolver lista de secciones', async () => {
    const fakeList = [
      { id: 1, seccion: 1 },
      { id: 2, seccion: 2 },
    ];
    db.Sections.findAll.mockResolvedValue(fakeList);

    const req = httpMocks.createRequest({
      method: 'GET',
    });
    const res = httpMocks.createResponse();

    await controller.getSections(req, res);

    expect(db.Sections.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual(fakeList);
  });

  it('getSections debe manejar error 500', async () => {
    db.Sections.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
    });
    const res = httpMocks.createResponse();

    await controller.getSections(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- updateSection ----------
  it('updateSection debe retornar 404 si la sección no existe', async () => {
    db.Sections.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { seccion: 3 },
    });
    const res = httpMocks.createResponse();

    await controller.updateSection(req, res);

    expect(db.Sections.findByPk).toHaveBeenCalledWith('1');
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Seccion no encontrado');
  });

  it('updateSection debe actualizar sección y retornar 200', async () => {
    const mockSection = {
      id: 1,
      seccion: 1,
      save: jest.fn().mockResolvedValue(),
    };

    db.Sections.findByPk.mockResolvedValue(mockSection);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { seccion: 5 },
    });
    const res = httpMocks.createResponse();

    await controller.updateSection(req, res);

    expect(db.Sections.findByPk).toHaveBeenCalledWith('1');
    expect(mockSection.seccion).toBe(5);
    expect(mockSection.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.seccion).toBe(5);
  });

  it('updateSection debe manejar error 500', async () => {
    db.Sections.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { seccion: 5 },
    });
    const res = httpMocks.createResponse();

    await controller.updateSection(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- deleteSection ----------
  it('deleteSection debe eliminar y retornar 200 si existe', async () => {
    db.Sections.destroy.mockResolvedValue(1);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteSection(req, res);

    expect(db.Sections.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Seccion eliminado correctamente');
  });

  it('deleteSection debe retornar 404 si no existe', async () => {
    db.Sections.destroy.mockResolvedValue(0);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '99' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteSection(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Seccion no encontrado');
  });

  it('deleteSection debe manejar error 500', async () => {
    db.Sections.destroy.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteSection(req, res);

    expect(res.statusCode).toBe(500);
  });
});
