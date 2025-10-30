// test/users.unit.test.js
const { createUser } = require('../controllers/users.controller');
const Users = require('../models/users.model');

jest.mock('../models/users.model'); // Simulamos el modelo Sequelize

describe('Pruebas Unitarias - createUser', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        personId: 1,
        userName: 'docente01',
        passwordHash: '123456',
        role: 'Docente',
        chargeDetail: 'Profesor de Matemáticas'
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('✅ debería crear un usuario correctamente', async () => {
    const mockUser = { 
        id: 1, 
        ...req.body, 
        toJSON: jest.fn().mockReturnValue({ id: 1, ...req.body }) 
    };
    Users.create.mockResolvedValue(mockUser);

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  it('❌ debería devolver error si faltan campos requeridos', async () => {
    req.body = {}; // sin datos obligatorios
    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No ha completado algunos campos' });
  });

  it('💥 debería capturar un error del servidor', async () => {
    Users.create.mockRejectedValue(new Error('DB error'));

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
