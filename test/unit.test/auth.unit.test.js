// test/unit.test/auth.unit.test.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const tokenBlacklist = require('../../services/tokenBlacklist');
const authController = require('../../controllers/auth.controller');
const db = require('../../models');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');

jest.mock('../../models', () => ({
  Users: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  TeacherAssignments: {
    findOne: jest.fn(),
  },
  Tutors: {
    findOne: jest.fn(),
  },
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../services/tokenBlacklist', () => ({
  add: jest.fn(),
}));
jest.mock('../../utils/jwt', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Controller - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------- login ----------
  describe('login', () => {
    it('debe devolver 400 si faltan credenciales', async () => {
      const req = { body: {} };
      const res = mockResponse();
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Faltan credenciales' });
      expect(next).not.toHaveBeenCalled();
    });

    it('debe devolver 401 si el usuario no existe', async () => {
      const req = { body: { username: 'user1', password: 'pass123' } };
      const res = mockResponse();
      const next = jest.fn();

      db.Users.findOne.mockResolvedValue(null);

      await authController.login(req, res, next);

      expect(db.Users.findOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario o contraseña inválidos',
      });
    });

    it('debe devolver 401 si la contraseña es inválida', async () => {
      const req = { body: { username: 'user1', password: 'wrongpass' } };
      const res = mockResponse();
      const next = jest.fn();

      db.Users.findOne.mockResolvedValue({
        id: 1,
        userName: 'user1',
        passwordHash: 'hashed',
        role: 'Administrador',
        personId: 10,
      });
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res, next);

      expect(bcrypt.compare).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario o contraseña inválidos',
      });
    });

    it('debe loguear usuario normal (sin teacher ni tutor) y devolver tokens', async () => {
      const req = { body: { username: 'user1', password: 'pass123' } };
      const res = mockResponse();
      const next = jest.fn();

      const userMock = {
        id: 1,
        userName: 'user1',
        passwordHash: 'hashed',
        role: 'Administrador',
        personId: null,
      };

      db.Users.findOne.mockResolvedValue(userMock);
      bcrypt.compare.mockResolvedValue(true);
      generateAccessToken.mockReturnValue('access-token');
      generateRefreshToken.mockReturnValue('refresh-token');

      await authController.login(req, res, next);

      expect(generateAccessToken).toHaveBeenCalledWith(userMock);
      expect(generateRefreshToken).toHaveBeenCalledWith(userMock);
      expect(res.json).toHaveBeenCalledWith({
        token: 'access-token',
        refreshToken: 'refresh-token',
        id: 1,
        username: 'user1',
        role: 'Administrador',
        user: {
          id: 1,
          username: 'user1',
          role: 'Administrador',
          personId: null,
          isTeacher: false,
          isTutor: false,
          tutorId: null,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debe marcar isTeacher e isTutor correctamente cuando aplica', async () => {
      const req = { body: { username: 'teacher1', password: 'pass123' } };
      const res = mockResponse();
      const next = jest.fn();

      const userMock = {
        id: 2,
        userName: 'teacher1',
        passwordHash: 'hashed',
        role: 'Docente',
        personId: 50,
      };

      db.Users.findOne.mockResolvedValue(userMock);
      bcrypt.compare.mockResolvedValue(true);

      db.TeacherAssignments.findOne.mockResolvedValue({ id: 100 });
      db.Tutors.findOne.mockResolvedValue({ id: 200 });

      generateAccessToken.mockReturnValue('access-token-teacher');
      generateRefreshToken.mockReturnValue('refresh-token-teacher');

      await authController.login(req, res, next);

      expect(db.TeacherAssignments.findOne).toHaveBeenCalled();
      expect(db.Tutors.findOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        token: 'access-token-teacher',
        refreshToken: 'refresh-token-teacher',
        id: 2,
        username: 'teacher1',
        role: 'Docente',
        user: {
          id: 2,
          username: 'teacher1',
          role: 'Docente',
          personId: 50,
          isTeacher: true,
          isTutor: true,
          tutorId: 200,
        },
      });
    });

    it('debe llamar a next(err) en caso de error inesperado', async () => {
      const req = { body: { username: 'user1', password: 'pass123' } };
      const res = mockResponse();
      const next = jest.fn();

      db.Users.findOne.mockRejectedValue(new Error('DB error'));

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // --------- refresh ----------
  describe('refresh', () => {
    it('debe devolver 401 si no se envía refreshToken', async () => {
      const req = { body: {} };
      const res = mockResponse();

      await authController.refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Refresh token requerido',
      });
    });

    it('debe devolver 401 si el token es inválido o expirado', async () => {
      const req = { body: { refreshToken: 'bad-token' } };
      const res = mockResponse();

      jwt.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await authController.refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Refresh token inválido o expirado',
      });
    });

    it('debe devolver 401 si el usuario no existe', async () => {
      const req = { body: { refreshToken: 'refresh-token' } };
      const res = mockResponse();

      jwt.verify.mockReturnValue({ sub: 10 });
      db.Users.findByPk.mockResolvedValue(null);

      await authController.refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado',
      });
    });

    it('debe devolver un nuevo access token cuando todo es válido', async () => {
      const req = { body: { refreshToken: 'refresh-token' } };
      const res = mockResponse();

      const userMock = { id: 5, userName: 'user5' };
      jwt.verify.mockReturnValue({ sub: 5 });
      db.Users.findByPk.mockResolvedValue(userMock);
      generateAccessToken.mockReturnValue('new-access-token');

      await authController.refresh(req, res);

      expect(generateAccessToken).toHaveBeenCalledWith(userMock);
      expect(res.json).toHaveBeenCalledWith({ token: 'new-access-token' });
    });
  });

  // --------- logout ----------
  describe('logout', () => {
    it('debe devolver ok true si no hay header Authorization', () => {
      const req = { headers: {} };
      const res = mockResponse();

      authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
      expect(tokenBlacklist.add).not.toHaveBeenCalled();
    });

    it('debe agregar el token a la blacklist cuando es válido', () => {
      const req = { headers: { authorization: 'Bearer token123' } };
      const res = mockResponse();

      jwt.verify.mockReturnValue({
        jti: 'jti-id',
        exp: 123456,
      });

      authController.logout(req, res);

      expect(jwt.verify).toHaveBeenCalled();
      expect(tokenBlacklist.add).toHaveBeenCalledWith('jti-id', 123456);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('no debe romperse si el token es inválido', () => {
      const req = { headers: { authorization: 'Bearer invalidtoken' } };
      const res = mockResponse();

      jwt.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      authController.logout(req, res);

      expect(tokenBlacklist.add).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
  });
});
