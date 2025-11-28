const yearsController = require('../../controllers/years.controller');
const db = require('../../models');

// Mock de db.Years
jest.mock('../../models', () => ({
  Years: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
}));

// helper para crear res mock
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Years Controller - Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createYear', () => {
    it('debe retornar 400 si no se envía year', async () => {
      const req = { body: {} };
      const res = mockResponse();

      await yearsController.createYear(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No ha completado los campos requeridos.',
      });
      expect(db.Years.create).not.toHaveBeenCalled();
    });

    it('debe crear un año y devolver 201', async () => {
      const req = { body: { year: 2025 } };
      const res = mockResponse();

      const fakeYear = { id: 1, year: 2025 };
      db.Years.create.mockResolvedValue(fakeYear);

      await yearsController.createYear(req, res);

      expect(db.Years.create).toHaveBeenCalledWith({ year: 2025 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeYear);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = { body: { year: 2025 } };
      const res = mockResponse();

      db.Years.create.mockRejectedValue(new Error('DB error'));

      await yearsController.createYear(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.',
      });
    });
  });

  describe('getYears', () => {
    it('debe obtener todos los años ordenados asc', async () => {
      const req = {};
      const res = mockResponse();

      const fakeYears = [
        { id: 1, year: 2023 },
        { id: 2, year: 2024 },
      ];

      db.Years.findAll.mockResolvedValue(fakeYears);

      await yearsController.getYears(req, res);

      expect(db.Years.findAll).toHaveBeenCalledWith({
        order: [['year', 'ASC']],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeYears);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = {};
      const res = mockResponse();

      db.Years.findAll.mockRejectedValue(new Error('DB error'));

      await yearsController.getYears(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.',
      });
    });
  });

  describe('updateYear', () => {
    it('debe retornar 404 si el año no existe', async () => {
      const req = { params: { id: 1 }, body: { year: 2030 } };
      const res = mockResponse();

      db.Years.findByPk.mockResolvedValue(null);

      await yearsController.updateYear(req, res);

      expect(db.Years.findByPk).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Año no encontrado.',
      });
    });

    it('debe actualizar el año y devolver 200', async () => {
      const req = { params: { id: 1 }, body: { year: 2030 } };
      const res = mockResponse();

      const fakeYearInstance = {
        id: 1,
        year: 2025,
        save: jest.fn().mockResolvedValue(),
      };

      db.Years.findByPk.mockResolvedValue(fakeYearInstance);

      await yearsController.updateYear(req, res);

      expect(db.Years.findByPk).toHaveBeenCalledWith(1);
      expect(fakeYearInstance.year).toBe(2030);
      expect(fakeYearInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeYearInstance);
    });

    it('debe manejar errores internos con 500', async () => {
      const req = { params: { id: 1 }, body: { year: 2030 } };
      const res = mockResponse();

      db.Years.findByPk.mockRejectedValue(new Error('DB error'));

      await yearsController.updateYear(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.',
      });
    });
  });

  describe('deleteYear', () => {
    it('debe eliminar un año existente y retornar 200', async () => {
      const req = { params: { id: 1 } };
      const res = mockResponse();

      db.Years.destroy.mockResolvedValue(1); // 1 registro eliminado

      await yearsController.deleteYear(req, res);

      expect(db.Years.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Año eliminado correctamente.',
      });
    });

    it('debe retornar 404 si el año no existe', async () => {
      const req = { params: { id: 999 } };
      const res = mockResponse();

      db.Years.destroy.mockResolvedValue(0);

      await yearsController.deleteYear(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Año no encontrado.',
      });
    });

    it('debe manejar errores internos con 500', async () => {
      const req = { params: { id: 1 } };
      const res = mockResponse();

      db.Years.destroy.mockRejectedValue(new Error('DB error'));

      await yearsController.deleteYear(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.',
      });
    });
  });
});
