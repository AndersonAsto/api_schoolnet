const request = require('supertest');
const app = require('../../server');
const db = require('../../models');

describe('Auth Endpoints - Integration Tests', () => {
  let testUser;
  let accessToken;
  let refreshToken;

  const testUsername = 'testuser_auth_integration';
  const plainPassword = 'testpass';

  beforeAll(async () => {
    // Aseguramos que usamos la BD de test y creamos un esquema limpio
    await db.sequelize.sync({ force: true });

    const person = await db.Persons.create({
      names: 'Test',
      lastNames: 'User',
      dni: '00000001',
      phone: '987654321',
      email: 'testuser@example.com',
      role: 'Administrador',
      status: true,
    });

    // OJO: usamos passwordHash con la contraseña en plano,
    // el hook beforeCreate del modelo Users se encarga de hashearla.
    testUser = await db.Users.create({
      userName: testUsername,
      passwordHash: plainPassword,
      role: 'Administrador',
      status: true,
      personId: person.id,
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  // --------- POST /api/auth/login ----------
  describe('POST /api/auth/login', () => {
    it('debe fallar validación si falta username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: '123456' });

      expect(res.status).toBe(400);
      // Los validators de express devuelven un array "errors"
      expect(res.body).toHaveProperty('errors');
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('debe fallar validación si password es muy corto', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUsername, password: '123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('debe devolver 401 si credenciales incorrectas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUsername, password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Usuario o contraseña inválidos');
    });

    it('debe loguear usuario válido y devolver tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUsername, password: plainPassword });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');

      accessToken = res.body.token;
      refreshToken = res.body.refreshToken;

      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
    });
  });

  // --------- POST /api/auth/refresh ----------
  describe('POST /api/auth/refresh', () => {
    it('debe devolver 401 si no se envía refreshToken', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Refresh token requerido');
    });

    it('debe devolver 401 si refreshToken es inválido', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'token-invalido' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty(
        'error',
        'Refresh token inválido o expirado'
      );
    });

    it('debe devolver nuevo access token si refreshToken es válido', async () => {
      // Nos aseguramos que refreshToken exista por si este describe corre
      // antes que el último test del login (por orden de Jest)
      if (!refreshToken) {
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ username: testUsername, password: plainPassword });

        expect(loginRes.status).toBe(200);
        refreshToken = loginRes.body.refreshToken;
      }

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.token).toBeTruthy();
    });
  });

  // --------- POST /api/auth/logout ----------
  describe('POST /api/auth/logout', () => {
    it('debe devolver ok true si no hay Authorization', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
    });

    it('debe devolver ok true si hay Authorization Bearer', async () => {
      // Igual, nos aseguramos que haya accessToken
      if (!accessToken) {
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ username: testUsername, password: plainPassword });

        expect(loginRes.status).toBe(200);
        accessToken = loginRes.body.token;
      }

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
    });

    it('debe devolver ok true aunque el token sea inválido', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer token-invalido')
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
    });
  });
});
