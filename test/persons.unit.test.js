const Persons = require('../models/persons.model');
const personsController = require('../controllers/persons.controller');

jest.mock('../models/persons.model');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Persons Controller - Unit Tests', () => {

  afterEach(() => jest.clearAllMocks());

  test('✅ createPerson - crea una persona correctamente', async () => {
    const req = { body: { names: 'Ana', lastNames: 'Ruiz', dni: '99999999', email: 'ana@test.com', phone: '12345', role: 'Docente' } };
    const res = mockResponse();
    Persons.create.mockResolvedValue(req.body);

    await personsController.createPerson(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(req.body);
  });

  test('🚫 deletePersonById - retorna 409 si hay conflicto de integridad', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    const fkError = new Error('FK constraint fails');
    fkError.name = 'SequelizeForeignKeyConstraintError';
    Persons.destroy.mockRejectedValue(fkError);

    await personsController.deletePersonById(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('🚫 deletePersonById - retorna 404 si no se encuentra', async () => {
    const req = { params: { id: 99 } };
    const res = mockResponse();

    Persons.destroy.mockResolvedValue(0);
    await personsController.deletePersonById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

});
