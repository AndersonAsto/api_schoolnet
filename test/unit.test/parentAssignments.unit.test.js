// test/unit.test/parentAssignments.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/parentAssignments.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  ParentAssignments: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  Persons: {
    findByPk: jest.fn(),
  },
  Users: {
    findByPk: jest.fn(),
  },
  Years: {},
  StudentEnrollments: {},
}));

describe('ParentAssignments Controller - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createParentAssignment ----------
  describe('createParentAssignment', () => {
    it('debe retornar 400 si faltan campos requeridos', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/representativeAssignments/create',
        body: {
          yearId: 1,
          personId: 2,
          // falta studentId
        },
      });
      const res = httpMocks.createResponse();

      await controller.createParentAssignment(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'No ha completado los campos requeridos.'
      );
      expect(db.ParentAssignments.create).not.toHaveBeenCalled();
    });

    it('debe crear y retornar la asignación de apoderado (201)', async () => {
      const mockAssignment = {
        id: 1,
        yearId: 1,
        personId: 2,
        studentId: 3,
        relationshipType: 'PADRE',
      };
      db.ParentAssignments.create.mockResolvedValue(mockAssignment);

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/representativeAssignments/create',
        body: {
          yearId: 1,
          personId: 2,
          studentId: 3,
          relationshipType: 'PADRE',
        },
      });
      const res = httpMocks.createResponse();

      await controller.createParentAssignment(req, res);

      expect(db.ParentAssignments.create).toHaveBeenCalledWith({
        yearId: 1,
        personId: 2,
        studentId: 3,
        relationshipType: 'PADRE',
      });

      expect(res.statusCode).toBe(201);
      const data = res._getJSONData();
      expect(data).toEqual(mockAssignment);
    });

    it('debe manejar un error interno con 500', async () => {
      db.ParentAssignments.create.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/representativeAssignments/create',
        body: {
          yearId: 1,
          personId: 2,
          studentId: 3,
          relationshipType: 'MADRE',
        },
      });
      const res = httpMocks.createResponse();

      await controller.createParentAssignment(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getParentAssignments ----------
  describe('getParentAssignments', () => {
    it('debe retornar lista de apoderados (200)', async () => {
      const mockList = [
        {
          id: 1,
          relationshipType: 'PADRE',
        },
      ];
      db.ParentAssignments.findAll.mockResolvedValue(mockList);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/representativeAssignments/list',
      });
      const res = httpMocks.createResponse();

      await controller.getParentAssignments(req, res);

      expect(db.ParentAssignments.findAll).toHaveBeenCalledWith({
        include: [
          {
            model: db.Persons,
            as: 'persons',
            attributes: ['id', 'names', 'lastNames', 'role'],
          },
          {
            model: db.Years,
            as: 'years',
            attributes: ['id', 'year'],
          },
          {
            model: db.StudentEnrollments,
            as: 'students',
            attributes: ['id'],
            include: [
              {
                model: db.Persons,
                as: 'persons',
                attributes: ['id', 'names', 'lastNames', 'role'],
              },
            ],
          },
        ],
        attributes: ['id', 'relationshipType', 'status', 'createdAt', 'updatedAt'],
      });

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toEqual(mockList);
    });

    it('debe manejar error interno con 500', async () => {
      db.ParentAssignments.findAll.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/representativeAssignments/list',
      });
      const res = httpMocks.createResponse();

      await controller.getParentAssignments(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- updateParentAssignment ----------
  describe('updateParentAssignment', () => {
    it('debe retornar 404 si no se encuentra el registro', async () => {
      db.ParentAssignments.findByPk.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/representativeAssignments/update/1',
        params: { id: 1 },
        body: {
          yearId: 1,
          personId: 2,
          studentId: 3,
          relationshipType: 'TUTOR',
        },
      });
      const res = httpMocks.createResponse();

      await controller.updateParentAssignment(req, res);

      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Apoderado no encontrado.');
    });

    it('debe actualizar y retornar el registro (200)', async () => {
      const mockRecord = {
        id: 1,
        yearId: 1,
        personId: 2,
        studentId: 3,
        relationshipType: 'PADRE',
        save: jest.fn().mockResolvedValue(true),
      };
      db.ParentAssignments.findByPk.mockResolvedValue(mockRecord);

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/representativeAssignments/update/1',
        params: { id: 1 },
        body: {
          yearId: 2,
          personId: 4,
          studentId: 5,
          relationshipType: 'TUTOR',
        },
      });
      const res = httpMocks.createResponse();

      await controller.updateParentAssignment(req, res);

      // Verificas que el mock fue actualizado
      expect(mockRecord.yearId).toBe(2);
      expect(mockRecord.personId).toBe(4);
      expect(mockRecord.studentId).toBe(5);
      expect(mockRecord.relationshipType).toBe('TUTOR');
      expect(mockRecord.save).toHaveBeenCalled();

      // Verificas la respuesta HTTP
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();

      // Verificas solo los datos (sin la función save)
      expect(data).toMatchObject({
        id: 1,
        yearId: 2,
        personId: 4,
        studentId: 5,
        relationshipType: 'TUTOR',
      });
    });

    it('debe manejar error interno con 500', async () => {
      db.ParentAssignments.findByPk.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/representativeAssignments/update/1',
        params: { id: 1 },
        body: {
          yearId: 2,
          personId: 4,
          studentId: 5,
          relationshipType: 'TUTOR',
        },
      });
      const res = httpMocks.createResponse();

      await controller.updateParentAssignment(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- deleteParentAssignment ----------
  describe('deleteParentAssignment', () => {
    it('debe retornar 400 si el id es inválido', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/representativeAssignments/delete/abc',
        params: { id: 'abc' },
      });
      const res = httpMocks.createResponse();

      await controller.deleteParentAssignment(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Identificador inválido o no proporcionado.'
      );
      expect(db.ParentAssignments.destroy).not.toHaveBeenCalled();
    });

    it('debe retornar 404 si no se eliminó ningún registro', async () => {
      db.ParentAssignments.destroy.mockResolvedValue(0);

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/representativeAssignments/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.deleteParentAssignment(req, res);

      expect(db.ParentAssignments.destroy).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Apoderado no encontrado.');
    });

    it('debe eliminar y retornar 200 si tuvo éxito', async () => {
      db.ParentAssignments.destroy.mockResolvedValue(1);

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/representativeAssignments/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.deleteParentAssignment(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Apoderado eliminado correctamente.'
      );
    });

    it('debe manejar error interno con 500', async () => {
      db.ParentAssignments.destroy.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/representativeAssignments/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.deleteParentAssignment(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getParentAssignmentByUser ----------
  describe('getParentAssignmentByUser', () => {
    it('debe retornar 404 si el usuario no existe', async () => {
      db.Users.findByPk.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/parentAssignments/by-user/1',
        params: { userId: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.getParentAssignmentByUser(req, res);

      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('error', 'Usuario no encontrado.');
    });

    it('debe retornar 404 si la persona asociada no existe', async () => {
      db.Users.findByPk.mockResolvedValue({ id: 1, personId: 10 });
      db.Persons.findByPk.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/parentAssignments/by-user/1',
        params: { userId: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.getParentAssignmentByUser(req, res);

      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'error',
        'Persona asociada no encontrada.'
      );
    });

    it('debe retornar 200 y lista de asignaciones cuando todo está OK', async () => {
      db.Users.findByPk.mockResolvedValue({ id: 1, personId: 10 });
      db.Persons.findByPk.mockResolvedValue({ id: 10 });
      const mockAssignments = [
        {
          id: 1,
          relationshipType: 'PADRE',
        },
      ];
      db.ParentAssignments.findAll.mockResolvedValue(mockAssignments);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/parentAssignments/by-user/1',
        params: { userId: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.getParentAssignmentByUser(req, res);

      expect(db.ParentAssignments.findAll).toHaveBeenCalledWith({
        where: { personId: 10 },
        include: [
          {
            model: db.Persons,
            as: 'persons',
            attributes: ['id', 'names', 'lastNames', 'role'],
          },
          {
            model: db.Years,
            as: 'years',
            attributes: ['id', 'year'],
          },
          {
            model: db.StudentEnrollments,
            as: 'students',
            attributes: ['id'],
            include: [
              {
                model: db.Persons,
                as: 'persons',
                attributes: ['id', 'names', 'lastNames', 'role'],
              },
            ],
          },
        ],
        attributes: ['id', 'relationshipType', 'status', 'createdAt', 'updatedAt'],
      });

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toEqual(mockAssignments);
    });

    it('debería manejar error interno con 500', async () => {
      db.Users.findByPk.mockRejectedValue(new Error('Error en BD'));

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/parentAssignments/by-user/1',
        params: { userId: '1' },
      });
      const res = httpMocks.createResponse();

      await controller.getParentAssignmentByUser(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });
});
