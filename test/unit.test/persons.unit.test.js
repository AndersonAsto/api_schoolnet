// test/unit.test/persons.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/persons.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  Persons: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('Persons Controller - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createPerson ----------
  describe('createPerson', () => {
    it('debe retornar 400 si faltan campos requeridos', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/persons/create',
        body: {
          names: 'Anderson',
          lastNames: 'Asto',
          dni: '12345678',
          email: 'test@example.com',
          // falta phone o role
          phone: '987654321',
          // role: 'Administrador'
        },
      });
      const res = httpMocks.createResponse();

      await controller.createPerson(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'error',
        'No ha completado todos los campos'
      );
      expect(db.Persons.create).not.toHaveBeenCalled();
    });

    it('debe crear una persona y retornar 201', async () => {
      const mockPerson = {
        id: 1,
        names: 'Anderson',
        lastNames: 'Asto',
        dni: '12345678',
        email: 'test@example.com',
        phone: '987654321',
        role: 'Administrador',
      };

      db.Persons.create.mockResolvedValue(mockPerson);

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/persons/create',
        body: {
          names: 'Anderson',
          lastNames: 'Asto',
          dni: '12345678',
          email: 'test@example.com',
          phone: '987654321',
          role: 'Administrador',
        },
      });
      const res = httpMocks.createResponse();

      await controller.createPerson(req, res);

      expect(db.Persons.create).toHaveBeenCalledWith({
        names: 'Anderson',
        lastNames: 'Asto',
        dni: '12345678',
        email: 'test@example.com',
        phone: '987654321',
        role: 'Administrador',
      });

      expect(res.statusCode).toBe(201);
      const data = res._getJSONData();
      expect(data).toEqual(mockPerson);
    });

    it('debe manejar error interno con 500', async () => {
      db.Persons.create.mockRejectedValue(new Error('Error en BD'));

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/persons/create',
        body: {
          names: 'Anderson',
          lastNames: 'Asto',
          dni: '12345678',
          email: 'test@example.com',
          phone: '987654321',
          role: 'Administrador',
        },
      });
      const res = httpMocks.createResponse();

      await controller.createPerson(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getPersons ----------
  describe('getPersons', () => {
    it('debe retornar lista de personas (200)', async () => {
      const mockList = [
        { id: 1, names: 'A', lastNames: 'B' },
        { id: 2, names: 'C', lastNames: 'D' },
      ];
      db.Persons.findAll.mockResolvedValue(mockList);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/persons/list',
      });
      const res = httpMocks.createResponse();

      await controller.getPersons(req, res);

      expect(db.Persons.findAll).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockList);
    });

    it('debe manejar error interno con 500', async () => {
      db.Persons.findAll.mockRejectedValue(new Error('Error en BD'));

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/persons/list',
      });
      const res = httpMocks.createResponse();

      await controller.getPersons(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- updatePerson ----------
  describe('updatePerson', () => {
    it('debe retornar 404 si la persona no existe', async () => {
      db.Persons.findByPk.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/persons/update/1',
        params: { id: 1 },
        body: {
          names: 'Nuevo',
          lastNames: 'Nombre',
          dni: '87654321',
          email: 'nuevo@example.com',
          phone: '912345678',
          role: 'Docente',
        },
      });
      const res = httpMocks.createResponse();

      await controller.updatePerson(req, res);

      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Persona no encontrada');
    });

    it('debe actualizar y retornar la persona (200)', async () => {
      const mockPerson = {
        id: 1,
        names: 'Old',
        lastNames: 'Name',
        dni: '12345678',
        email: 'old@example.com',
        phone: '987654321',
        role: 'Administrador',
        save: jest.fn().mockResolvedValue(true),
      };
      db.Persons.findByPk.mockResolvedValue(mockPerson);

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/persons/update/1',
        params: { id: 1 },
        body: {
          names: 'Nuevo',
          lastNames: 'Nombre',
          dni: '87654321',
          email: 'nuevo@example.com',
          phone: '912345678',
          role: 'Docente',
        },
      });
      const res = httpMocks.createResponse();

      await controller.updatePerson(req, res);

      // Verificas que el modelo en memoria se actualizó
      expect(mockPerson.names).toBe('Nuevo');
      expect(mockPerson.lastNames).toBe('Nombre');
      expect(mockPerson.dni).toBe('87654321');
      expect(mockPerson.email).toBe('nuevo@example.com');
      expect(mockPerson.phone).toBe('912345678');
      expect(mockPerson.role).toBe('Docente');
      expect(mockPerson.save).toHaveBeenCalled();

      // Verificas la respuesta HTTP
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();

      // Solo comparas los campos de datos
      expect(data).toMatchObject({
        id: 1,
        names: 'Nuevo',
        lastNames: 'Nombre',
        dni: '87654321',
        email: 'nuevo@example.com',
        phone: '912345678',
        role: 'Docente',
      });
    });

    it('debe manejar error interno con 500', async () => {
      db.Persons.findByPk.mockRejectedValue(new Error('Error en BD'));

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/persons/update/1',
        params: { id: 1 },
        body: {
          names: 'Nuevo',
          lastNames: 'Nombre',
          dni: '87654321',
          email: 'nuevo@example.com',
          phone: '912345678',
          role: 'Docente',
        },
      });
      const res = httpMocks.createResponse();

      await controller.updatePerson(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- deletePerson ----------
  describe('deletePerson', () => {
    it('debe retornar 400 si el id es inválido', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/persons/delete/abc',
        params: { id: 'abc' },
      });
      const res = httpMocks.createResponse();

      await controller.deletePerson(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'ID inválido o no proporcionado'
      );
      expect(db.Persons.destroy).not.toHaveBeenCalled();
    });

    it('debe retornar 404 si no se eliminó ningún registro', async () => {
      db.Persons.destroy.mockResolvedValue(0);

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/persons/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.deletePerson(req, res);

      expect(db.Persons.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Persona no encontrada');
    });

    it('debe eliminar y retornar 200 si tuvo éxito', async () => {
      db.Persons.destroy.mockResolvedValue(1);

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/persons/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.deletePerson(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Persona eliminada correctamente'
      );
    });

    it('debe manejar error interno con 500', async () => {
      db.Persons.destroy.mockRejectedValue(new Error('Error en BD'));

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/persons/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.deletePerson(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getPersonsByPrivilege ----------
  describe('getPersonsByPrivilege', () => {
    it('debe retornar 200 con lista filtrada por roles con privilegios', async () => {
      const mockList = [
        { id: 1, role: 'Administrador' },
        { id: 2, role: 'Docente' },
      ];
      db.Persons.findAll.mockResolvedValue(mockList);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/persons/byPrivilegien',
      });
      const res = httpMocks.createResponse();

      await controller.getPersonsByPrivilege(req, res);

      expect(db.Persons.findAll).toHaveBeenCalledWith({
        where: {
          role: ['Administrador', 'Docente', 'Apoderado'],
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockList);
    });

    it('debe manejar error interno con 500', async () => {
      db.Persons.findAll.mockRejectedValue(new Error('Error en BD'));

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/persons/byPrivilegien',
      });
      const res = httpMocks.createResponse();

      await controller.getPersonsByPrivilege(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getPersonsByRole ----------
  describe('getPersonsByRole', () => {
    it('debe retornar 400 si el rol es inválido', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/persons/byRole/InvalidRole',
        params: { role: 'InvalidRole' },
      });
      const res = httpMocks.createResponse();

      await controller.getPersonsByRole(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Rol inválido');
      expect(db.Persons.findAll).not.toHaveBeenCalled();
    });

    it('debe retornar 200 con lista filtrada por rol válido', async () => {
      const mockList = [{ id: 1, role: 'Docente' }];
      db.Persons.findAll.mockResolvedValue(mockList);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/persons/byRole/Docente',
        params: { role: 'Docente' },
      });
      const res = httpMocks.createResponse();

      await controller.getPersonsByRole(req, res);

      expect(db.Persons.findAll).toHaveBeenCalledWith({
        where: { role: 'Docente' },
      });

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockList);
    });

    it('debe manejar error interno con 500', async () => {
      db.Persons.findAll.mockRejectedValue(new Error('Error en BD'));

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/persons/byRole/Docente',
        params: { role: 'Docente' },
      });
      const res = httpMocks.createResponse();

      await controller.getPersonsByRole(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });
});
