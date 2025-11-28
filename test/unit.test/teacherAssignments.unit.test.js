// test/unit.test/teacherAssignments.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/teacherAssignments.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  TeacherAssignments: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  Persons: {},
  Years: {},
  Courses: {},
}));

describe('TeacherAssignments Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createTeacherAssignment ----------
  it('createTeacherAssignment debe retornar 400 si faltan campos requeridos', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        personId: 1,
        yearId: null,
        courseId: 2,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createTeacherAssignment(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty('error', 'No ha completado algunos campos');
  });

  it('createTeacherAssignment debe crear y retornar 201', async () => {
    const fakeAssignment = { id: 1, personId: 1, yearId: 1, courseId: 2 };
    db.TeacherAssignments.create.mockResolvedValue(fakeAssignment);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        personId: 1,
        yearId: 1,
        courseId: 2,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createTeacherAssignment(req, res);

    expect(db.TeacherAssignments.create).toHaveBeenCalledWith({
      personId: 1,
      yearId: 1,
      courseId: 2,
    });
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data).toEqual(fakeAssignment);
  });

  it('createTeacherAssignment debe manejar error 500', async () => {
    db.TeacherAssignments.create.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        personId: 1,
        yearId: 1,
        courseId: 2,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createTeacherAssignment(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTeacherAssignments ----------
  it('getTeacherAssignments debe devolver lista', async () => {
    const fakeList = [{ id: 1 }, { id: 2 }];
    db.TeacherAssignments.findAll.mockResolvedValue(fakeList);

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await controller.getTeacherAssignments(req, res);

    expect(db.TeacherAssignments.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual(fakeList);
  });

  it('getTeacherAssignments debe manejar error 500', async () => {
    db.TeacherAssignments.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await controller.getTeacherAssignments(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- updateTeacherAssignment ----------
  it('updateTeacherAssignment debe retornar 404 si no encuentra asignación', async () => {
    db.TeacherAssignments.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { personId: 1, yearId: 1, courseId: 2 },
    });
    const res = httpMocks.createResponse();

    await controller.updateTeacherAssignment(req, res);

    expect(db.TeacherAssignments.findByPk).toHaveBeenCalledWith('1');
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Docente no encontrado.');
  });

  it('updateTeacherAssignment debe actualizar y retornar 200', async () => {
    const mockAssignment = {
      id: 1,
      personId: 10,
      yearId: 2024,
      courseId: 3,
      save: jest.fn().mockResolvedValue(),
    };
    db.TeacherAssignments.findByPk.mockResolvedValue(mockAssignment);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { personId: 20, yearId: 2025, courseId: 4 },
    });
    const res = httpMocks.createResponse();

    await controller.updateTeacherAssignment(req, res);

    expect(db.TeacherAssignments.findByPk).toHaveBeenCalledWith('1');
    expect(mockAssignment.personId).toBe(20);
    expect(mockAssignment.yearId).toBe(2025);
    expect(mockAssignment.courseId).toBe(4);
    expect(mockAssignment.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.personId).toBe(20);
  });

  it('updateTeacherAssignment debe manejar error 500', async () => {
    db.TeacherAssignments.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { personId: 20, yearId: 2025, courseId: 4 },
    });
    const res = httpMocks.createResponse();

    await controller.updateTeacherAssignment(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- deleteTeacherAssignment ----------
  it('deleteTeacherAssignment debe retornar 400 si id inválido', async () => {
    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: 'abc' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTeacherAssignment(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Identificador inválido o no proporcionado.'
    );
  });

  it('deleteTeacherAssignment debe retornar 404 si no se elimina nada', async () => {
    db.TeacherAssignments.destroy.mockResolvedValue(0);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTeacherAssignment(req, res);

    expect(db.TeacherAssignments.destroy).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Docente no encontrado.');
  });

  it('deleteTeacherAssignment debe retornar 200 si elimina', async () => {
    db.TeacherAssignments.destroy.mockResolvedValue(1);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTeacherAssignment(req, res);

    expect(db.TeacherAssignments.destroy).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Docente eliminado correctamente.'
    );
  });

  it('deleteTeacherAssignment debe manejar error 500', async () => {
    db.TeacherAssignments.destroy.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTeacherAssignment(req, res);

    expect(res.statusCode).toBe(500);
  });
});
