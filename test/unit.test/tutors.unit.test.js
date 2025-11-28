// test/unit.test/tutors.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/tutors.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  Tutors: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
    findOne: jest.fn(),
  },
  TeacherAssignments: {},
  Grades: {},
  Sections: {},
  Years: {},
  Persons: {},
  Courses: {},
  StudentEnrollments: {
    findByPk: jest.fn(),
  },
}));

describe('Tutors Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createTutor ----------
  it('createTutor debe retornar 400 si faltan datos requeridos', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { teacherId: 1, gradeId: 1 }, // falta sectionId
    });
    const res = httpMocks.createResponse();

    await controller.createTutor(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.message).toMatch(/No ha completado los campos requeridos/i);
  });

  it('createTutor debe crear y retornar 201 cuando los datos son válidos', async () => {
    const mockTutor = {
      id: 1,
      teacherId: 1,
      gradeId: 2,
      sectionId: 3,
    };

    db.Tutors.create.mockResolvedValue(mockTutor);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { teacherId: 1, gradeId: 2, sectionId: 3 },
    });
    const res = httpMocks.createResponse();

    await controller.createTutor(req, res);

    expect(db.Tutors.create).toHaveBeenCalledWith({
      teacherId: 1,
      gradeId: 2,
      sectionId: 3,
    });
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data).toEqual(mockTutor);
  });

  it('createTutor debe manejar error 500', async () => {
    db.Tutors.create.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { teacherId: 1, gradeId: 2, sectionId: 3 },
    });
    const res = httpMocks.createResponse();

    await controller.createTutor(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTutors ----------
  it('getTutors debe retornar lista de tutores', async () => {
    db.Tutors.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await controller.getTutors(req, res);

    expect(db.Tutors.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
  });

  it('getTutors debe manejar error 500', async () => {
    db.Tutors.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await controller.getTutors(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTutorByStudent ----------
  it('getTutorByStudent debe retornar 404 si estudiante no existe', async () => {
    db.StudentEnrollments.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTutorByStudent(req, res);

    expect(db.StudentEnrollments.findByPk).toHaveBeenCalledWith('1');
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Estudiante no encontrado/i);
  });

  it('getTutorByStudent debe retornar tutor si existe', async () => {
    const mockEnrollment = { id: 10, gradeId: 2, sectionId: 3 };
    const mockTutor = { id: 1, teacherId: 1 };

    db.StudentEnrollments.findByPk.mockResolvedValue(mockEnrollment);
    db.Tutors.findOne.mockResolvedValue(mockTutor);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getTutorByStudent(req, res);

    expect(db.Tutors.findOne).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual(mockTutor);
  });

  it('getTutorByStudent debe manejar error 500', async () => {
    db.StudentEnrollments.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getTutorByStudent(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTutorsById ----------
  it('getTutorsById debe llamar a findAll con where id', async () => {
    db.Tutors.findAll.mockResolvedValue([{ id: 1 }]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTutorsById(req, res);

    expect(db.Tutors.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
      })
    );
    expect(res.statusCode).toBe(200);
  });

  it('getTutorsById debe manejar error 500', async () => {
    db.Tutors.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTutorsById(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- updateTutor ----------
  it('updateTutor debe retornar 404 si el tutor no existe', async () => {
    db.Tutors.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { teacherId: 1, gradeId: 2, sectionId: 3 },
    });
    const res = httpMocks.createResponse();

    await controller.updateTutor(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Tutor no encontrado/i);
  });

  it('updateTutor debe actualizar y retornar 200', async () => {
    const mockTutor = {
      id: 1,
      teacherId: 1,
      gradeId: 2,
      sectionId: 3,
      save: jest.fn().mockResolvedValue(),
    };

    db.Tutors.findByPk.mockResolvedValue(mockTutor);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { teacherId: 5, gradeId: 6, sectionId: 7 },
    });
    const res = httpMocks.createResponse();

    await controller.updateTutor(req, res);

    expect(mockTutor.teacherId).toBe(5);
    expect(mockTutor.gradeId).toBe(6);
    expect(mockTutor.sectionId).toBe(7);
    expect(mockTutor.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('updateTutor debe manejar error 500', async () => {
    db.Tutors.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { teacherId: 5, gradeId: 6, sectionId: 7 },
    });
    const res = httpMocks.createResponse();

    await controller.updateTutor(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- deleteTutor ----------
  it('deleteTutor debe retornar 400 si id es inválido', async () => {
    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: 'abc' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTutor(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Identificador inválido/i);
  });

  it('deleteTutor debe retornar 404 si no se elimina nada', async () => {
    db.Tutors.destroy.mockResolvedValue(0);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTutor(req, res);

    expect(db.Tutors.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(res.statusCode).toBe(404);
  });

  it('deleteTutor debe retornar 200 si elimina', async () => {
    db.Tutors.destroy.mockResolvedValue(1);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTutor(req, res);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.message).toMatch(/eliminado correctamente/i);
  });

  it('deleteTutor debe manejar error 500', async () => {
    db.Tutors.destroy.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTutor(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTutorsByYear ----------
  it('getTutorsByYear debe retornar 404 si no manda yearId', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: {},
    });
    const res = httpMocks.createResponse();

    await controller.getTutorsByYear(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('getTutorsByYear debe retornar lista de tutores por año', async () => {
    db.Tutors.findAll.mockResolvedValue([{ id: 1 }]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTutorsByYear(req, res);

    expect(db.Tutors.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { yearId: '1' } })
    );
    expect(res.statusCode).toBe(200);
  });

  it('getTutorsByYear debe manejar error 500', async () => {
    db.Tutors.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTutorsByYear(req, res);

    expect(res.statusCode).toBe(500);
  });
});
