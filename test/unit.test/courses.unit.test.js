// test/unit.test/courses.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/courses.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  Courses: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('Courses Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createCourse ----------
  it('createCourse debe retornar 400 si no se envía course', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {},
    });
    const res = httpMocks.createResponse();

    await controller.createCourse(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.error).toMatch(/No ha completado los campos requeridos/i);
  });

  it('createCourse debe crear un curso y retornar 201', async () => {
    const mockCourse = { id: 1, course: 'Matemática', recurrence: 4 };
    db.Courses.create.mockResolvedValue(mockCourse);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { course: 'Matemática', recurrence: 4 },
    });
    const res = httpMocks.createResponse();

    await controller.createCourse(req, res);

    expect(db.Courses.create).toHaveBeenCalledWith({ course: 'Matemática', recurrence: 4 });
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data.course).toBe('Matemática');
    expect(data.recurrence).toBe(4);
  });

  it('createCourse debe manejar error 500', async () => {
    db.Courses.create.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { course: 'Comunicación', recurrence: 3 },
    });
    const res = httpMocks.createResponse();

    await controller.createCourse(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getCourses ----------
  it('getCourses debe retornar la lista de cursos', async () => {
    db.Courses.findAll.mockResolvedValue([
      { id: 1, course: 'Matemática' },
      { id: 2, course: 'Comunicación' },
    ]);

    const req = httpMocks.createRequest({
      method: 'GET',
    });
    const res = httpMocks.createResponse();

    await controller.getCourses(req, res);

    expect(db.Courses.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
  });

  it('getCourses debe manejar error 500', async () => {
    db.Courses.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
    });
    const res = httpMocks.createResponse();

    await controller.getCourses(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- updateCourse ----------
  it('updateCourse debe retornar 404 si el curso no existe', async () => {
    db.Courses.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { course: 'Ciencia', recurrence: 2 },
    });
    const res = httpMocks.createResponse();

    await controller.updateCourse(req, res);

    expect(db.Courses.findByPk).toHaveBeenCalledWith('1');
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Curso no encontrado/i);
  });

  it('updateCourse debe actualizar el curso y retornar 200', async () => {
    const mockCourse = {
      id: 1,
      course: 'Antiguo',
      recurrence: 1,
      save: jest.fn().mockResolvedValue(),
    };
    db.Courses.findByPk.mockResolvedValue(mockCourse);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { course: 'Nuevo curso', recurrence: 5 },
    });
    const res = httpMocks.createResponse();

    await controller.updateCourse(req, res);

    expect(mockCourse.course).toBe('Nuevo curso');
    expect(mockCourse.recurrence).toBe(5);
    expect(mockCourse.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.course).toBe('Nuevo curso');
    expect(data.recurrence).toBe(5);
  });

  it('updateCourse debe manejar error 500', async () => {
    db.Courses.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { course: 'Algo', recurrence: 1 },
    });
    const res = httpMocks.createResponse();

    await controller.updateCourse(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- deleteCourse (solo en unit, no se usará en integración) ----------
  it('deleteCourse debe retornar 200 si elimina', async () => {
    db.Courses.destroy.mockResolvedValue(1);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteCourse(req, res);

    expect(db.Courses.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Curso eliminado correctamente/i);
  });

  it('deleteCourse debe retornar 404 si no existe', async () => {
    db.Courses.destroy.mockResolvedValue(0);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteCourse(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Curso no encontrado/i);
  });

  it('deleteCourse debe manejar error 500', async () => {
    db.Courses.destroy.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteCourse(req, res);

    expect(res.statusCode).toBe(500);
  });
});
