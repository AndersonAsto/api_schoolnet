// test/unit.test/users.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/users.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  Users: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  Persons: {},
}));

describe('Users Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createUser ----------
  it('createUser debe retornar 400 si faltan campos requeridos', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        personId: 1,
        userName: 'user1',
        // falta passwordHash o role, etc.
      },
    });
    const res = httpMocks.createResponse();

    await controller.createUser(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.error).toMatch(/No ha completado los campos requeridos/i);
  });

  it('createUser debe crear usuario y no devolver passwordHash', async () => {
    const mockUser = {
      id: 1,
      personId: 1,
      userName: 'user1',
      passwordHash: 'hash123',
      role: 'Administrador',
      chargeDetail: 'Admin',
      toJSON() {
        return {
          id: this.id,
          personId: this.personId,
          userName: this.userName,
          passwordHash: this.passwordHash,
          role: this.role,
          chargeDetail: this.chargeDetail,
        };
      },
    };

    db.Users.create.mockResolvedValue(mockUser);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        personId: 1,
        userName: 'user1',
        passwordHash: '123456',
        role: 'Administrador',
        chargeDetail: 'Admin',
      },
    });
    const res = httpMocks.createResponse();

    await controller.createUser(req, res);

    expect(db.Users.create).toHaveBeenCalledWith({
      personId: 1,
      userName: 'user1',
      passwordHash: '123456',
      role: 'Administrador',
      chargeDetail: 'Admin',
    });
    expect(res.statusCode).toBe(201);

    const data = res._getJSONData();
    expect(data.passwordHash).toBeUndefined();
    expect(data.userName).toBe('user1');
  });

  it('createUser debe manejar error 500', async () => {
    db.Users.create.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        personId: 1,
        userName: 'user1',
        passwordHash: '123456',
        role: 'Administrador',
      },
    });
    const res = httpMocks.createResponse();

    await controller.createUser(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getUsers ----------
  it('getUsers debe retornar lista de usuarios', async () => {
    db.Users.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await controller.getUsers(req, res);

    expect(db.Users.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
  });

  it('getUsers debe manejar error 500', async () => {
    db.Users.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await controller.getUsers(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getUsersByRole ----------
  it('getUsersByRole debe retornar 400 si el rol es inválido', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { role: 'Invalido' },
    });
    const res = httpMocks.createResponse();

    await controller.getUsersByRole(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Rol inválido/i);
  });

  it('getUsersByRole debe retornar usuarios para rol válido', async () => {
    db.Users.findAll.mockResolvedValue([{ id: 1, role: 'Administrador' }]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { role: 'Administrador' },
    });
    const res = httpMocks.createResponse();

    await controller.getUsersByRole(req, res);

    expect(db.Users.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: 'Administrador' },
      })
    );
    expect(res.statusCode).toBe(200);
  });

  it('getUsersByRole debe manejar error 500', async () => {
    db.Users.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { role: 'Administrador' },
    });
    const res = httpMocks.createResponse();

    await controller.getUsersByRole(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- updateUser ----------
  it('updateUser debe retornar 404 si usuario no existe', async () => {
    db.Users.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        personId: 1,
        userName: 'nuevo',
        role: 'Docente',
        chargeDetail: 'detalle',
      },
    });
    const res = httpMocks.createResponse();

    await controller.updateUser(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Usuario no encontrado/i);
  });

  it('updateUser debe actualizar usuario y no devolver passwordHash', async () => {
    const mockUser = {
      id: 1,
      personId: 1,
      userName: 'old',
      role: 'Docente',
      chargeDetail: 'detalle',
      passwordHash: 'hash',
      save: jest.fn().mockResolvedValue(),
      toJSON() {
        return {
          id: this.id,
          personId: this.personId,
          userName: this.userName,
          role: this.role,
          chargeDetail: this.chargeDetail,
          passwordHash: this.passwordHash,
        };
      },
    };

    db.Users.findByPk.mockResolvedValue(mockUser);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        personId: 2,
        userName: 'newUser',
        role: 'Administrador',
        chargeDetail: 'Nuevo detalle',
      },
    });
    const res = httpMocks.createResponse();

    await controller.updateUser(req, res);

    expect(mockUser.personId).toBe(2);
    expect(mockUser.userName).toBe('newUser');
    expect(mockUser.role).toBe('Administrador');
    expect(mockUser.chargeDetail).toBe('Nuevo detalle');
    expect(mockUser.save).toHaveBeenCalled();

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.passwordHash).toBeUndefined();
  });

  it('updateUser debe manejar error 500', async () => {
    db.Users.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        personId: 2,
        userName: 'newUser',
        role: 'Administrador',
        chargeDetail: 'Nuevo detalle',
      },
    });
    const res = httpMocks.createResponse();

    await controller.updateUser(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- deleteStudent ----------
  it('deleteStudent debe retornar 200 si elimina', async () => {
    db.Users.destroy.mockResolvedValue(1);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteStudent(req, res);

    expect(db.Users.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Usuario eliminado correctamente/i);
  });

  it('deleteStudent debe retornar 404 si no encuentra el usuario', async () => {
    db.Users.destroy.mockResolvedValue(0);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteStudent(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Usuario no encontrado/i);
  });

  it('deleteStudent debe manejar error 500', async () => {
    db.Users.destroy.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteStudent(req, res);

    expect(res.statusCode).toBe(500);
  });
});
