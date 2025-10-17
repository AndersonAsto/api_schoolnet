// test/users.unit.test.js
const usersController = require('../controllers/users.controller');
const Users = require('../models/users.model');
const Persons = require('../models/persons.model');

// Mock de modelos
jest.mock('../models/users.model');
jest.mock('../models/persons.model');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('🎯 Controlador: users', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createUser', () => {
    it('✅ crea un usuario correctamente', async () => {
      const req = { body: { personId: 1, userName: 'admin', passwordHash: 'hash', role: 'Administrador' } };
      const res = mockResponse();

      Users.create.mockResolvedValue({ toJSON: () => ({ id: 1, userName: 'admin', role: 'Administrador' }) });

      await usersController.createUser(req, res);

      expect(Users.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ userName: 'admin' }));
    });

    it('⚠️ devuelve 400 si faltan campos', async () => {
      const req = { body: { userName: '', passwordHash: '', role: '' } };
      const res = mockResponse();

      await usersController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('❌ maneja errores de base de datos', async () => {
      const req = { body: { personId: 1, userName: 'x', passwordHash: '123', role: 'Docente' } };
      const res = mockResponse();
      Users.create.mockRejectedValue(new Error('DB error'));

      await usersController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUsers', () => {
    it('✅ retorna lista de usuarios', async () => {
      const req = {}, res = mockResponse();
      Users.findAll.mockResolvedValue([{ id: 1, userName: 'user' }]);

      await usersController.getUsers(req, res);

      expect(Users.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('❌ maneja errores al listar', async () => {
      const req = {}, res = mockResponse();
      Users.findAll.mockRejectedValue(new Error('DB error'));

      await usersController.getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteStudentById', () => {
    it('✅ elimina usuario correctamente', async () => {
      const req = { params: { id: 1 } }, res = mockResponse();
      Users.destroy.mockResolvedValue(1);

      await usersController.deleteStudentById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('⚠️ usuario no encontrado', async () => {
      const req = { params: { id: 99 } }, res = mockResponse();
      Users.destroy.mockResolvedValue(0);

      await usersController.deleteStudentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('🚫 error por dependencia (409)', async () => {
      const req = { params: { id: 1 } }, res = mockResponse();
      const err = new Error('FK error');
      err.name = 'SequelizeForeignKeyConstraintError';
      Users.destroy.mockRejectedValue(err);

      await usersController.deleteStudentById(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });
});
