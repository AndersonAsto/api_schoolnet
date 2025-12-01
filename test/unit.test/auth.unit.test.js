// test/unit.test/auth.unit.test.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const tokenBlacklist = require('../../services/tokenBlacklist');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');
const db = require('../../models');
const authController = require('../../controllers/auth.controller');

// Mock de dependencias externas
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

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../utils/jwt', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

jest.mock('../../services/tokenBlacklist', () => ({
  add: jest.fn(),
}));

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((data) => {
    res.body = data;
    return res;
  });
  return res;
};

describe('Auth Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------- login --------------------
  describe('login', () => {
    it('debe retornar 400 si faltan credenciales', async () => {
      const req = { body: { username: '', password: '' } };
      const res = createMockRes();
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body).toEqual({ error: 'Faltan credenciales' });
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 401 si el usuario no existe', async () => {
      db.Users.findOne.mockResolvedValue(null);

      const req = { body: { username: 'user', password: 'pass' } };
      const res = createMockRes();
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(db.Users.findOne).toHaveBeenCalledWith({
        where: { userName: 'user', status: true },
        attributes: ['id', 'userName', 'passwordHash', 'role', 'personId'],
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.error).toMatch(/Usuario o contraseña inválidos/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 401 si la contraseña es inválida', async () => {
      db.Users.findOne.mockResolvedValue({
        id: 1,
        userName: 'user',
        passwordHash: 'hash',
        role: 'Docente',
        personId: 10,
      });

      bcrypt.compare.mockResolvedValue(false);

      const req = { body: { username: 'user', password: 'wrong' } };
      const res = createMockRes();
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'hash');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.error).toMatch(/Usuario o contraseña inválidos/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('debe hacer login correcto y marcar isTeacher e isTutor cuando corresponde', async () => {
      const mockUser = {
        id: 1,
        userName: 'teacherUser',
        passwordHash: 'hash',
        role: 'Docente',
        personId: 99,
      };

      db.Users.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      db.TeacherAssignments.findOne.mockResolvedValue({
        id: 5,
      });

      db.Tutors.findOne.mockResolvedValue({
        id: 7,
      });

      generateAccessToken.mockReturnValue('access-token');
      generateRefreshToken.mockReturnValue('refresh-token');

      const req = { body: { username: 'teacherUser', password: '123456' } };
      const res = createMockRes();
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(db.Users.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        '123456',
        mockUser.passwordHash
      );

      expect(db.TeacherAssignments.findOne).toHaveBeenCalledWith({
        where: { personId: mockUser.personId, status: true },
        attributes: ['id'],
      });

      expect(db.Tutors.findOne).toHaveBeenCalledWith({
        where: { teacherId: 5, status: true },
        attributes: ['id'],
      });

      expect(generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(generateRefreshToken).toHaveBeenCalledWith(mockUser);

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBe('access-token');
      expect(res.body.refreshToken).toBe('refresh-token');
      expect(res.body.user).toEqual({
        id: 1,
        username: 'teacherUser',
        role: 'Docente',
        personId: 99,
        isTeacher: true,
        isTutor: true,
        tutorId: 7,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debe login correcto como usuario sin asignación docente ni tutor', async () => {
      const mockUser = {
        id: 2,
        userName: 'admin',
        passwordHash: 'hash',
        role: 'Administrador',
        personId: 50,
      };

      db.Users.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      db.TeacherAssignments.findOne.mockResolvedValue(null);
      db.Tutors.findOne.mockResolvedValue(null);

      generateAccessToken.mockReturnValue('access-token-admin');
      generateRefreshToken.mockReturnValue('refresh-token-admin');

      const req = { body: { username: 'admin', password: 'secret' } };
      const res = createMockRes();
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(db.TeacherAssignments.findOne).toHaveBeenCalled();
      expect(db.Tutors.findOne).not.toHaveBeenCalled();

      expect(res.statusCode).toBe(200);
      expect(res.body.user.isTeacher).toBe(false);
      expect(res.body.user.isTutor).toBe(false);
      expect(res.body.user.tutorId).toBeNull();
      expect(next).not.toHaveBeenCalled();
    });

    it('debe llamar next(err) ante un error inesperado', async () => {
      db.Users.findOne.mockRejectedValue(new Error('Error BD'));

      const req = { body: { username: 'x', password: 'y' } };
      const res = createMockRes();
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      const [err] = next.mock.calls[0];
      expect(err).toBeInstanceOf(Error);
    });
  });

  // -------------------- refresh --------------------
  describe('refresh', () => {
    it('debe retornar 401 si no se envía refreshToken', async () => {
      const req = { body: {} };
      const res = createMockRes();

      await authController.refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.error).toMatch(/Refresh token requerido/i);
    });

    it('debe retornar 401 si el refreshToken es inválido', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      const req = { body: { refreshToken: 'invalid-token' } };
      const res = createMockRes();

      await authController.refresh(req, res);

      expect(jwt.verify).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.error).toMatch(/Refresh token inválido o expirado/i);
    });

    it('debe retornar 401 si el usuario del refreshToken no existe', async () => {
      jwt.verify.mockReturnValue({
        sub: 999,
      });

      db.Users.findByPk.mockResolvedValue(null);

      const req = { body: { refreshToken: 'valid-token' } };
      const res = createMockRes();

      await authController.refresh(req, res);

      expect(db.Users.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.error).toMatch(/Usuario no encontrado/i);
    });

    it('debe retornar 200 con nuevo accessToken si refreshToken es válido', async () => {
      jwt.verify.mockReturnValue({
        sub: 3,
      });

      const mockUser = {
        id: 3,
        userName: 'user3',
      };

      db.Users.findByPk.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue('new-access-token');

      const req = { body: { refreshToken: 'valid-token' } };
      const res = createMockRes();

      await authController.refresh(req, res);

      expect(db.Users.findByPk).toHaveBeenCalledWith(3);
      expect(generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBe('new-access-token');
    });
  });

  // -------------------- logout --------------------
  describe('logout', () => {
    it('debe devolver ok:true si no hay header Authorization', () => {
      const req = { headers: {} };
      const res = createMockRes();

      authController.logout(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ ok: true });
      expect(tokenBlacklist.add).not.toHaveBeenCalled();
    });

    it('debe agregar el token a la blacklist si el token es válido', () => {
      const req = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      jwt.verify.mockReturnValue({
        jti: 'id-token',
        exp: 1234567890,
      });

      const res = createMockRes();

      authController.logout(req, res);

      expect(jwt.verify).toHaveBeenCalled();
      expect(tokenBlacklist.add).toHaveBeenCalledWith('id-token', 1234567890);
      expect(res.body).toEqual({ ok: true });
    });

    it('no debe lanzar error si el token es inválido y siempre responder ok:true', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };

      jwt.verify.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      const res = createMockRes();

      authController.logout(req, res);

      expect(tokenBlacklist.add).not.toHaveBeenCalled();
      expect(res.body).toEqual({ ok: true });
    });
  });
});
