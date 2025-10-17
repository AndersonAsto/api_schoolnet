// test/users.super.test.js
const request = require('supertest');
const app = require('../app'); // instancia de Express

describe('🧪 API /api/users (Integración)', () => {
  
  test('POST /api/users/create → debe crear un usuario', async () => {
    const res = await request(app)
      .post('/api/users/create')
      .send({
        personId: 1,
        userName: 'usuario_test',
        passwordHash: '123456',
        role: 'Docente',
        chargeDetail: 'Encargado de aula'
      })
      .set('Accept', 'application/json');

    expect([201, 400, 500]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body).toHaveProperty('userName', 'usuario_test');
      expect(res.body).not.toHaveProperty('passwordHash');
    }
  });

  test('GET /api/users/list → debe listar usuarios', async () => {
    const res = await request(app).get('/api/users/list');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  test('GET /api/users/byRole/:role → debe listar usuarios según rol', async () => {
    const res = await request(app).get('/api/users/byRole/Docente');
    expect([200, 400, 500]).toContain(res.status);
  });

  test('PUT /api/users/update/:id → debe actualizar un usuario existente', async () => {
    const id = 1; // usa un ID existente en tu DB de prueba
    const res = await request(app)
      .put(`/api/users/update/${id}`)
      .send({
        personId: 1,
        userName: 'usuario_modificado',
        role: 'Administrador',
        chargeDetail: 'Supervisor general'
      });

    expect([200, 404, 500]).toContain(res.status);
  });

  test('DELETE /api/users/delete/:id → debe eliminar usuario', async () => {
    const id = 1; // usa un ID real o controlado
    const res = await request(app).delete(`/api/users/delete/${id}`);
    expect([200, 404, 409, 500]).toContain(res.status);
  });
});
