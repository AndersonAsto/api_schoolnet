// test/unit.test/teachingBlockAverage.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/teachingBlockAverage.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  TeacherGroups: {
    findByPk: jest.fn(),
  },
  Qualifications: {
    findAll: jest.fn(),
  },
  Evaluations: {
    findAll: jest.fn(),
  },
  TeachingBlockAverage: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  },
  TeachingBlocks: {},
  TeacherGroupsModel: {}, // por si necesitas diferenciar, pero no se usa aquí
  StudentEnrollments: {},
  StudentsEnrollments: {},
  Courses: {},
  Grades: {},
  Sections: {},
  Years: {},
  Persons: {},
}));

describe('TeachingBlockAverage Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- previewTeachingBlockAverage ----------
  it('previewTeachingBlockAverage debe retornar 400 si faltan parámetros', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, assignmentId: null, teachingBlockId: 1 },
    });
    const res = httpMocks.createResponse();

    await controller.previewTeachingBlockAverage(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.message).toMatch(/Faltan parámetros obligatorios/);
  });

  it('previewTeachingBlockAverage debe retornar 404 si no existe TeacherGroup', async () => {
    db.TeacherGroups.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, assignmentId: 10, teachingBlockId: 2 },
    });
    const res = httpMocks.createResponse();

    await controller.previewTeachingBlockAverage(req, res);

    expect(db.TeacherGroups.findByPk).toHaveBeenCalledWith(10);
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.message).toBe('TeacherGroup no encontrado');
  });

  it('previewTeachingBlockAverage debe calcular y devolver data (sin guardar)', async () => {
    db.TeacherGroups.findByPk.mockResolvedValue({
      id: 10,
      gradeId: 1,
      sectionId: 1,
      courseId: 1,
    });

    db.Qualifications.findAll.mockResolvedValue([
      { rating: '15' },
      { rating: '17' },
    ]);

    db.Evaluations.findAll
      .mockResolvedValueOnce([
        { score: '16' },
        { score: '18' },
      ]) // prácticas
      .mockResolvedValueOnce([{ score: '14' }]); // exámenes

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, assignmentId: 10, teachingBlockId: 2 },
    });
    const res = httpMocks.createResponse();

    await controller.previewTeachingBlockAverage(req, res);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toHaveProperty('data');
    const { dailyAvarage, practiceAvarage, examAvarage, teachingBlockAvarage } =
      data.data;

    // No hace falta ser ultra exactos, pero podemos validar tipos
    expect(typeof dailyAvarage).toBe('number');
    expect(typeof practiceAvarage).toBe('number');
    expect(typeof examAvarage).toBe('number');
    expect(typeof teachingBlockAvarage).toBe('string');
  });

  it('previewTeachingBlockAverage debe manejar error 500', async () => {
    db.TeacherGroups.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, assignmentId: 10, teachingBlockId: 2 },
    });
    const res = httpMocks.createResponse();

    await controller.previewTeachingBlockAverage(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- calculateTeachingBlockAverage ----------
  it('calculateTeachingBlockAverage debe retornar 400 si faltan parámetros', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, assignmentId: 10 }, // falta teachingBlockId
    });
    const res = httpMocks.createResponse();

    await controller.calculateTeachingBlockAverage(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('calculateTeachingBlockAverage debe retornar 404 si no existe TeacherGroup', async () => {
    db.TeacherGroups.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, assignmentId: 10, teachingBlockId: 2 },
    });
    const res = httpMocks.createResponse();

    await controller.calculateTeachingBlockAverage(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('calculateTeachingBlockAverage debe crear nuevo promedio si no existe', async () => {
    db.TeacherGroups.findByPk.mockResolvedValue({
      id: 10,
      gradeId: 1,
      sectionId: 1,
      courseId: 1,
    });

    db.Qualifications.findAll.mockResolvedValue([{ rating: '15' }]);
    db.Evaluations.findAll
      .mockResolvedValueOnce([{ score: '16' }]) // practicas
      .mockResolvedValueOnce([{ score: '17' }]); // examenes

    db.TeachingBlockAverage.findOne.mockResolvedValue(null);
    db.TeachingBlockAverage.create.mockResolvedValue({ id: 1 });

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, assignmentId: 10, teachingBlockId: 2 },
    });
    const res = httpMocks.createResponse();

    await controller.calculateTeachingBlockAverage(req, res);

    expect(db.TeachingBlockAverage.findOne).toHaveBeenCalledWith({
      where: { studentId: 1, assignmentId: 10, teachingBlockId: 2 },
    });
    expect(db.TeachingBlockAverage.create).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.message).toBe('Promedio creado correctamente');
  });

  it('calculateTeachingBlockAverage debe actualizar si ya existe', async () => {
    db.TeacherGroups.findByPk.mockResolvedValue({
      id: 10,
      gradeId: 1,
      sectionId: 1,
      courseId: 1,
    });

    db.Qualifications.findAll.mockResolvedValue([{ rating: '15' }]);
    db.Evaluations.findAll
      .mockResolvedValueOnce([{ score: '16' }])
      .mockResolvedValueOnce([{ score: '17' }]);

    const mockExisting = {
      update: jest.fn().mockResolvedValue(),
    };
    db.TeachingBlockAverage.findOne.mockResolvedValue(mockExisting);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, assignmentId: 10, teachingBlockId: 2 },
    });
    const res = httpMocks.createResponse();

    await controller.calculateTeachingBlockAverage(req, res);

    expect(mockExisting.update).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.message).toBe('Promedio actualizado correctamente');
  });

  it('calculateTeachingBlockAverage debe manejar error 500', async () => {
    db.TeacherGroups.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { studentId: 1, assignmentId: 10, teachingBlockId: 2 },
    });
    const res = httpMocks.createResponse();

    await controller.calculateTeachingBlockAverage(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTeachingBlockAverageByStudent ----------
  it('getTeachingBlockAverageByStudent debe retornar 404 si no hay registros', async () => {
    db.TeachingBlockAverage.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByStudent(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('getTeachingBlockAverageByStudent debe devolver lista si hay datos', async () => {
    db.TeachingBlockAverage.findAll.mockResolvedValue([{ id: 1 }]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByStudent(req, res);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(Array.isArray(data)).toBe(true);
  });

  it('getTeachingBlockAverageByStudent debe manejar error 500', async () => {
    db.TeachingBlockAverage.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByStudent(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTeachingBlockAverageByGroup ----------
  it('getTeachingBlockAverageByGroup debe retornar 404 si no hay registros', async () => {
    db.TeachingBlockAverage.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { assignmentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByGroup(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('getTeachingBlockAverageByGroup debe devolver lista si hay datos', async () => {
    db.TeachingBlockAverage.findAll.mockResolvedValue([{ id: 1 }]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { assignmentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByGroup(req, res);

    expect(res.statusCode).toBe(200);
  });

  it('getTeachingBlockAverageByGroup debe manejar error 500', async () => {
    db.TeachingBlockAverage.findAll.mockRejectedValue(
      new Error('Error BD')
    );

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { assignmentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByGroup(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTeachingBlockAverageByBlock ----------
  it('getTeachingBlockAverageByBlock debe retornar 404 si no hay registros', async () => {
    db.TeachingBlockAverage.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { teachingBlockId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByBlock(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('getTeachingBlockAverageByBlock debe devolver lista si hay datos', async () => {
    db.TeachingBlockAverage.findAll.mockResolvedValue([{ id: 1 }]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { teachingBlockId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByBlock(req, res);

    expect(res.statusCode).toBe(200);
  });

  it('getTeachingBlockAverageByBlock debe manejar error 500', async () => {
    db.TeachingBlockAverage.findAll.mockRejectedValue(
      new Error('Error BD')
    );

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { teachingBlockId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByBlock(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTeachingBlockAverageByYearGroupAndStudent ----------
  it('getTeachingBlockAverageByYearGroupAndStudent debe retornar 400 si faltan parámetros', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: null, yearId: '1', assignmentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByYearGroupAndStudent(
      req,
      res
    );

    expect(res.statusCode).toBe(400);
  });

  it('getTeachingBlockAverageByYearGroupAndStudent debe retornar 404 si no hay registros', async () => {
    db.TeachingBlockAverage.findAll.mockResolvedValue([]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '1', yearId: '1', assignmentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByYearGroupAndStudent(
      req,
      res
    );

    expect(res.statusCode).toBe(404);
  });

  it('getTeachingBlockAverageByYearGroupAndStudent debe devolver lista si hay datos', async () => {
    db.TeachingBlockAverage.findAll.mockResolvedValue([{ id: 1 }]);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '1', yearId: '1', assignmentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByYearGroupAndStudent(
      req,
      res
    );

    expect(res.statusCode).toBe(200);
  });

  it('getTeachingBlockAverageByYearGroupAndStudent debe manejar error 500', async () => {
    db.TeachingBlockAverage.findAll.mockRejectedValue(
      new Error('Error BD')
    );

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentId: '1', yearId: '1', assignmentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeachingBlockAverageByYearGroupAndStudent(
      req,
      res
    );

    expect(res.statusCode).toBe(500);
  });
});
