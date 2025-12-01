// test/unit.test/annualAverage.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/annualAverage.controller');
const db = require('../../models');
const { Op } = require('sequelize');

jest.mock('sequelize', () => {
  const actual = jest.requireActual('sequelize');
  return {
    ...actual,
    Op: {
      in: 'Op.in',
    },
  };
});

jest.mock('../../models', () => ({
  AnnualAverage: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  },
  OverallCourseAverage: {
    findAll: jest.fn(),
  },
  TeacherGroups: {},
  Courses: {},
  Tutors: {
    findByPk: jest.fn(),
  },
  StudentEnrollments: {
    findAll: jest.fn(),
  },
  Persons: {},
  Grades: {},
  Sections: {},
  Years: {},
}));

describe('AnnualAverage Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- calculateAnnualAverage ----------
  it('calculateAnnualAverage debe retornar 400 si faltan parámetros', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {},
    });
    const res = httpMocks.createResponse();

    await controller.calculateAnnualAverage(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.status).toBe(false);
  });

  it('calculateAnnualAverage debe retornar 404 si no hay promedios generales', async () => {
    db.OverallCourseAverage.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, yearId: 2024 },
    });
    const res = httpMocks.createResponse();

    await controller.calculateAnnualAverage(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.status).toBe(false);
    expect(data.message).toMatch(/No se encontraron promedios generales/i);
  });

  it('calculateAnnualAverage debe retornar 400 si hay menos de 10 cursos distintos', async () => {
    db.OverallCourseAverage.findAll.mockResolvedValue([
      {
        courseAverage: '15.5',
        teachergroups: { courseId: 1 },
      },
      {
        courseAverage: '14.0',
        teachergroups: { courseId: 1 },
      },
    ]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, yearId: 2024 },
    });
    const res = httpMocks.createResponse();

    await controller.calculateAnnualAverage(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.status).toBe(false);
    expect(data.message).toMatch(/solo 1 cursos registrados/i);
  });

  it('calculateAnnualAverage debe crear un nuevo promedio anual (201)', async () => {
    const mockCourseAverages = [];
    for (let i = 1; i <= 10; i += 1) {
      mockCourseAverages.push({
        courseAverage: String(10 + i),
        teachergroups: { courseId: i },
      });
    }

    db.OverallCourseAverage.findAll.mockResolvedValue(mockCourseAverages);
    db.AnnualAverage.findOne.mockResolvedValue(null);
    db.AnnualAverage.create.mockResolvedValue({
      id: 1,
      studentId: 1,
      yearId: 2024,
      average: '15.50',
    });

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, yearId: 2024 },
    });
    const res = httpMocks.createResponse();

    await controller.calculateAnnualAverage(req, res);

    expect(db.OverallCourseAverage.findAll).toHaveBeenCalled();
    expect(db.AnnualAverage.findOne).toHaveBeenCalledWith({
      where: { studentId: 1, yearId: 2024 },
    });
    expect(db.AnnualAverage.create).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data.status).toBe(true);
    expect(data.data.average).toBeDefined();
  });

  it('calculateAnnualAverage debe actualizar un promedio anual existente (200)', async () => {
    const mockCourseAverages = [];
    for (let i = 1; i <= 10; i += 1) {
      mockCourseAverages.push({
        courseAverage: String(12 + i),
        teachergroups: { courseId: i },
      });
    }

    db.OverallCourseAverage.findAll.mockResolvedValue(mockCourseAverages);

    const existingRecord = {
      id: 1,
      studentId: 1,
      yearId: 2024,
      average: '14.00',
      save: jest.fn().mockResolvedValue(),
    };

    db.AnnualAverage.findOne.mockResolvedValue(existingRecord);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, yearId: 2024 },
    });
    const res = httpMocks.createResponse();

    await controller.calculateAnnualAverage(req, res);

    expect(existingRecord.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.status).toBe(true);
    expect(data.message).toMatch(/actualizado correctamente/i);
  });

  it('calculateAnnualAverage debe manejar error 500', async () => {
    db.OverallCourseAverage.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, yearId: 2024 },
    });
    const res = httpMocks.createResponse();

    await controller.calculateAnnualAverage(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getAnnualAverageByYearAndTutor ----------
  it('getAnnualAverageByYearAndTutor debe retornar 400 si falta yearId', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '', tutorId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndTutor(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('getAnnualAverageByYearAndTutor debe retornar 400 si falta tutorId', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '2024', tutorId: '' },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndTutor(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('getAnnualAverageByYearAndTutor debe retornar 404 si el tutor no existe', async () => {
    db.Tutors.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '2024', tutorId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndTutor(req, res);

    expect(db.Tutors.findByPk).toHaveBeenCalledWith('1');
    expect(res.statusCode).toBe(404);
  });

  it('getAnnualAverageByYearAndTutor debe retornar lista vacía si no hay matrículas', async () => {
    db.Tutors.findByPk.mockResolvedValue({ id: 1, gradeId: 1, sectionId: 1 });
    db.StudentEnrollments.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '2024', tutorId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndTutor(req, res);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.status).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBe(0);
  });

  it('getAnnualAverageByYearAndTutor debe retornar 200 con promedios anuales', async () => {
    db.Tutors.findByPk.mockResolvedValue({ id: 1, gradeId: 1, sectionId: 1 });

    db.StudentEnrollments.findAll.mockResolvedValue([
      { id: 10 },
      { id: 11 },
    ]);

    db.AnnualAverage.findAll.mockResolvedValue([
      { id: 1, studentId: 10, average: '15.50' },
    ]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '2024', tutorId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndTutor(req, res);

    expect(db.AnnualAverage.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.status).toBe(true);
  });

  it('getAnnualAverageByYearAndTutor debe manejar error 500', async () => {
    db.Tutors.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '2024', tutorId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndTutor(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getAnnualAverageByYearAndStudent ----------
  it('getAnnualAverageByYearAndStudent debe retornar 400 si faltan parámetros', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '', studentId: '' },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndStudent(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('getAnnualAverageByYearAndStudent debe retornar 404 si no existe registro', async () => {
    db.AnnualAverage.findOne.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '2024', studentId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndStudent(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.status).toBe(false);
  });

  it('getAnnualAverageByYearAndStudent debe retornar 200 con promedio anual', async () => {
    db.AnnualAverage.findOne.mockResolvedValue({
      id: 1,
      studentId: 10,
      yearId: 2024,
      average: '16.00',
    });

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '2024', studentId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndStudent(req, res);

    expect(db.AnnualAverage.findOne).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.status).toBe(true);
  });

  it('getAnnualAverageByYearAndStudent debe manejar error 500', async () => {
    db.AnnualAverage.findOne.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '2024', studentId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndStudent(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getAnnualAverageByYearAndStudents ----------
  it('getAnnualAverageByYearAndStudents debe retornar 400 si falta yearId o lista vacía', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { yearId: null, studentIds: [] },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndStudents(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('getAnnualAverageByYearAndStudents debe retornar 404 si no hay registros', async () => {
    db.AnnualAverage.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { yearId: 2024, studentIds: [10, 11] },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndStudents(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.status).toBe(false);
  });

  it('getAnnualAverageByYearAndStudents debe retornar 200 con lista de promedios', async () => {
    db.AnnualAverage.findAll.mockResolvedValue([
      { id: 1, studentId: 10, average: '15.0' },
      { id: 2, studentId: 11, average: '16.0' },
    ]);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { yearId: 2024, studentIds: [10, 11] },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndStudents(req, res);

    expect(db.AnnualAverage.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.status).toBe(true);
  });

  it('getAnnualAverageByYearAndStudents debe manejar error 500', async () => {
    db.AnnualAverage.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { yearId: 2024, studentIds: [10, 11] },
    });
    const res = httpMocks.createResponse();

    await controller.getAnnualAverageByYearAndStudents(req, res);

    expect(res.statusCode).toBe(500);
  });
});
