// test/unit.test/holidays.unit.test.js
const httpMocks = require('node-mocks-http');
const holidaysController = require('../../controllers/holidays.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  Holidays: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  Years: {}, // por si se usa en includes
}));

describe('Holidays Controller - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------- createHoliday -------
  describe('createHoliday', () => {
    it('debe retornar 400 si faltan campos requeridos', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/holidays/create',
        body: { yearId: 1 }, // falta holiday
      });
      const res = httpMocks.createResponse();

      await holidaysController.createHoliday(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'No ha completado los campos requeridos.'
      );
      expect(db.Holidays.create).not.toHaveBeenCalled();
    });

    it('debe crear un feriado y devolver 201', async () => {
      const mockHoliday = {
        id: 1,
        yearId: 1,
        holiday: '2025-01-01',
        status: true,
      };
      db.Holidays.create.mockResolvedValue(mockHoliday);

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/holidays/create',
        body: {
          yearId: 1,
          holiday: '2025-01-01',
        },
      });
      const res = httpMocks.createResponse();

      await holidaysController.createHoliday(req, res);

      expect(db.Holidays.create).toHaveBeenCalledWith({
        yearId: 1,
        holiday: '2025-01-01',
      });
      expect(res.statusCode).toBe(201);
      const data = res._getJSONData();
      expect(data).toEqual(mockHoliday);
    });

    it('debe manejar errores internos con 500', async () => {
      db.Holidays.create.mockRejectedValue(new Error('Error en BD'));

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/holidays/create',
        body: {
          yearId: 1,
          holiday: '2025-01-01',
        },
      });
      const res = httpMocks.createResponse();

      await holidaysController.createHoliday(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ------- getHolidays -------
  describe('getHolidays', () => {
    it('debe obtener todos los feriados con include de Years', async () => {
      const mockHolidays = [
        {
          id: 1,
          yearId: 1,
          holiday: '2025-01-01',
          status: true,
          years: { id: 1, year: '2025', status: true },
        },
      ];
      db.Holidays.findAll.mockResolvedValue(mockHolidays);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/holidays/list',
      });
      const res = httpMocks.createResponse();

      await holidaysController.getHolidays(req, res);

      expect(db.Holidays.findAll).toHaveBeenCalledWith({
        include: {
          model: db.Years,
          as: 'years',
          attributes: ['id', 'year', 'status'],
        },
      });
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockHolidays);
    });

    it('debe manejar errores internos con 500', async () => {
      db.Holidays.findAll.mockRejectedValue(new Error('Error en findAll'));

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/holidays/list',
      });
      const res = httpMocks.createResponse();

      await holidaysController.getHolidays(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ------- updateHoliday -------
  describe('updateHoliday', () => {
    it('debe retornar 404 si el feriado no existe', async () => {
      db.Holidays.findByPk.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/holydays/update/1',
        params: { id: '1' },
        body: { yearId: 1, holiday: '2025-01-01' },
      });
      const res = httpMocks.createResponse();

      await holidaysController.updateHoliday(req, res);

      expect(db.Holidays.findByPk).toHaveBeenCalledWith('1');
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      // Nota: el mensaje en tu controlador es "Incidente no encontrado."
      expect(data).toHaveProperty('message', 'Incidente no encontrado.');
    });

    it('debe actualizar el feriado y devolver 200', async () => {
      const mockHolidayInstance = {
        id: 1,
        yearId: 1,
        holiday: '2025-01-01',
        save: jest.fn().mockResolvedValue(true),
      };
      db.Holidays.findByPk.mockResolvedValue(mockHolidayInstance);

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/holydays/update/1',
        params: { id: '1' },
        body: { yearId: 2, holiday: '2025-02-14' },
      });
      const res = httpMocks.createResponse();

      await holidaysController.updateHoliday(req, res);

      // Verificas que el modelo mock se actualizó
      expect(db.Holidays.findByPk).toHaveBeenCalledWith('1');
      expect(mockHolidayInstance.yearId).toBe(2);
      expect(mockHolidayInstance.holiday).toBe('2025-02-14');
      expect(mockHolidayInstance.save).toHaveBeenCalled();

      // Verificas la respuesta HTTP
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();

      // Solo comparas las propiedades de datos
      expect(data).toMatchObject({
        id: 1,
        yearId: 2,
        holiday: '2025-02-14',
      });
    });

    it('debe manejar errores internos con 500', async () => {
      db.Holidays.findByPk.mockRejectedValue(new Error('Error en findByPk'));

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/holydays/update/1',
        params: { id: '1' },
        body: { yearId: 2, holiday: '2025-02-14' },
      });
      const res = httpMocks.createResponse();

      await holidaysController.updateHoliday(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ------- getHolidaysByYear -------
  describe('getHolidaysByYear', () => {
    it('debe obtener feriados por yearId', async () => {
      const mockHolidays = [
        { id: 1, yearId: 1, holiday: '2025-01-01', status: true },
      ];
      db.Holidays.findAll.mockResolvedValue(mockHolidays);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/holidays/byYear/1',
        params: { yearId: '1' },
      });
      const res = httpMocks.createResponse();

      await holidaysController.getHolidaysByYear(req, res);

      expect(db.Holidays.findAll).toHaveBeenCalledWith({ where: { yearId: '1' } });
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockHolidays);
    });

    it('debe manejar errores internos con 500', async () => {
      db.Holidays.findAll.mockRejectedValue(new Error('Error en findAll'));

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/holidays/byYear/1',
        params: { yearId: '1' },
      });
      const res = httpMocks.createResponse();

      await holidaysController.getHolidaysByYear(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ------- deleteHoliday (solo unidad, sin integración) -------
  describe('deleteHoliday', () => {
    const { deleteHoliday } = require('../../controllers/holidays.controller');

    it('debe retornar 400 si el id es inválido o no proporcionado', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/holydays/delete/abc',
        params: { id: 'abc' },
      });
      const res = httpMocks.createResponse();

      await deleteHoliday(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Identificador inválido o no proporcionado.'
      );
      expect(db.Holidays.destroy).not.toHaveBeenCalled();
    });

    it('debe retornar 404 si el feriado no existe', async () => {
      db.Holidays.destroy.mockResolvedValue(0);

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/holydays/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await deleteHoliday(req, res);

      expect(db.Holidays.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Día feriado no encontrada.'
      );
    });

    it('debe eliminar el feriado y retornar 200', async () => {
      db.Holidays.destroy.mockResolvedValue(1);

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/holydays/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await deleteHoliday(req, res);

      expect(db.Holidays.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Día feriado eliminado correctamente.'
      );
    });

    it('debe manejar errores internos con 500', async () => {
      db.Holidays.destroy.mockRejectedValue(new Error('Error en destroy'));

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/holydays/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await deleteHoliday(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });
});
