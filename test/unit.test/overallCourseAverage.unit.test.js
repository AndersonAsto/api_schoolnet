// test/unit.test/overallCourseAverage.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/overallCourseAverage.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  TeachingBlockAverage: {
    findAll: jest.fn(),
  },
  OverallCourseAverage: {
    findOrCreate: jest.fn(),
    findAll: jest.fn(),
  },
  TeachingBlocks: {},
  StudentEnrollments: {},
  Persons: {},
  Grades: {},
  Sections: {},
  TeacherGroups: {},
  Courses: {},
  Years: {},
}));

describe('OverallCourseAverage Controller - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- calculateOverallCourseAverage ----------
  describe('calculateOverallCourseAverage', () => {
    it('debe retornar 400 si faltan parámetros requeridos', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/generalAvarage/calculate',
        body: {
          studentId: 1,
          // falta assignmentId o yearId
        },
      });
      const res = httpMocks.createResponse();

      await controller.calculateOverallCourseAverage(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Faltan parámetros: studentId, scheduleId o yearId'
      );
      expect(db.TeachingBlockAverage.findAll).not.toHaveBeenCalled();
    });

    it('debe retornar 404 si no hay promedios de bloques lectivos', async () => {
      db.TeachingBlockAverage.findAll.mockResolvedValue([]);

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/generalAvarage/calculate',
        body: {
          studentId: 1,
          assignmentId: 2,
          yearId: 2025,
        },
      });
      const res = httpMocks.createResponse();

      await controller.calculateOverallCourseAverage(req, res);

      expect(db.TeachingBlockAverage.findAll).toHaveBeenCalledWith({
        where: { studentId: 1, assignmentId: 2 },
        include: [
          {
            model: db.TeachingBlocks,
            as: 'teachingblocks',
            attributes: ['id', 'teachingBlock', 'startDay', 'endDay', 'yearId'],
            where: { yearId: 2025 },
          },
        ],
        order: [['teachingBlockId', 'ASC']],
      });

      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'No se encontraron promedios de bloques lectivos para este estudiante y año.'
      );
    });

    it('debe calcular promedio anual y crear registro si no existe', async () => {
      const mockBlocks = [
        { teachingBlockAvarage: '15.50' },
        { teachingBlockAvarage: '14.50' },
      ];
      db.TeachingBlockAverage.findAll.mockResolvedValue(mockBlocks);

      const mockRecord = {
        id: 1,
        studentId: 1,
        assignmentId: 2,
        yearId: 2025,
        block1Average: 15.5,
        block2Average: 14.5,
        block3Average: null,
        block4Average: null,
        courseAverage: '15.00',
      };

      db.OverallCourseAverage.findOrCreate.mockResolvedValue([mockRecord, true]);

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/generalAvarage/calculate',
        body: {
          studentId: 1,
          assignmentId: 2,
          yearId: 2025,
        },
      });
      const res = httpMocks.createResponse();

      await controller.calculateOverallCourseAverage(req, res);

      expect(db.TeachingBlockAverage.findAll).toHaveBeenCalled();
      expect(db.OverallCourseAverage.findOrCreate).toHaveBeenCalledWith({
        where: { studentId: 1, assignmentId: 2, yearId: 2025 },
        defaults: {
          block1Average: 15.5,
          block2Average: 14.5,
          block3Average: null,
          block4Average: null,
          courseAverage: '15.00',
          status: true,
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Promedio anual registrado correctamente.'
      );
      expect(data).toHaveProperty('courseAverage');
      expect(data.courseAverage).toEqual(mockRecord);
    });

    it('debe actualizar registro existente cuando findOrCreate devuelve created=false', async () => {
      const mockBlocks = [
        { teachingBlockAvarage: '10.00' },
        { teachingBlockAvarage: '12.00' },
        { teachingBlockAvarage: '13.00' },
      ];
      db.TeachingBlockAverage.findAll.mockResolvedValue(mockBlocks);

      const mockRecord = {
        id: 1,
        block1Average: null,
        block2Average: null,
        block3Average: null,
        block4Average: null,
        courseAverage: null,
        save: jest.fn().mockResolvedValue(true),
      };

      db.OverallCourseAverage.findOrCreate.mockResolvedValue([mockRecord, false]);

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/generalAvarage/calculate',
        body: {
          studentId: 1,
          assignmentId: 2,
          yearId: 2025,
        },
      });
      const res = httpMocks.createResponse();

      await controller.calculateOverallCourseAverage(req, res);

      expect(mockRecord.block1Average).toBe(10.0);
      expect(mockRecord.block2Average).toBe(12.0);
      expect(mockRecord.block3Average).toBe(13.0);
      expect(mockRecord.block4Average).toBe(null);
      expect(mockRecord.courseAverage).toBe('11.67');
      expect(mockRecord.save).toHaveBeenCalled();

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Promedio anual actualizado.');
      expect(data).toHaveProperty('courseAverage');
    });

    it('debe manejar error interno con 500', async () => {
      db.TeachingBlockAverage.findAll.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/generalAvarage/calculate',
        body: {
          studentId: 1,
          assignmentId: 2,
          yearId: 2025,
        },
      });
      const res = httpMocks.createResponse();

      await controller.calculateOverallCourseAverage(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getOverallCourseAverageByYearAndStudent ----------
  describe('getOverallCourseAverageByYearAndStudent', () => {
    it('debe retornar 400 si faltan parámetros', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-filters',
        query: { studentId: '1' }, // falta yearId
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearAndStudent(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty('status', false);
      expect(data).toHaveProperty(
        'message',
        'Faltan parámetros requeridos: studentId, yearId o assignmentId.'
      );
    });

    it('debe retornar 404 si no hay registros', async () => {
      db.OverallCourseAverage.findAll.mockResolvedValue([]);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-filters',
        query: { studentId: '1', yearId: '2025' },
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearAndStudent(req, res);

      expect(db.OverallCourseAverage.findAll).toHaveBeenCalledWith({
        where: { studentId: '1', yearId: '2025' },
        include: [
          {
            model: db.StudentEnrollments,
            as: 'students',
            attributes: ['id'],
            include: [
              {
                model: db.Persons,
                as: 'persons',
                attributes: ['names', 'lastNames'],
              },
            ],
          },
          {
            model: db.Years,
            as: 'years',
            attributes: ['year'],
          },
          {
            model: db.TeacherGroups,
            as: 'teachergroups',
            attributes: [
              'id',
              'teacherAssignmentId',
              'gradeId',
              'sectionId',
              'courseId',
            ],
            include: [
              {
                model: db.Courses,
                as: 'courses',
                attributes: ['course'],
              },
              {
                model: db.Grades,
                as: 'grades',
                attributes: ['grade'],
              },
              {
                model: db.Sections,
                as: 'sections',
                attributes: ['seccion'],
              },
            ],
          },
        ],
        order: [['id', 'ASC']],
      });

      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('status', false);
      expect(data).toHaveProperty(
        'message',
        'No se encontraron promedios generales para los filtros seleccionados.'
      );
    });

    it('debe retornar 200 y datos si hay registros', async () => {
      const mockRecords = [
        {
          id: 1,
          courseAverage: '15.00',
        },
      ];
      db.OverallCourseAverage.findAll.mockResolvedValue(mockRecords);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-filters',
        query: { studentId: '1', yearId: '2025' },
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearAndStudent(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty('status', true);
      expect(data).toHaveProperty(
        'message',
        'Promedios generales por cursos encontrados.'
      );
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toEqual(mockRecords);
    });

    it('debe manejar error interno con 500', async () => {
      db.OverallCourseAverage.findAll.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-filters',
        query: { studentId: '1', yearId: '2025' },
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearAndStudent(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getOverallCourseAverageByYearAndGroup ----------
  describe('getOverallCourseAverageByYearAndGroup', () => {
    it('debe retornar 400 si faltan parámetros', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-assignment',
        query: { yearId: '2025' }, // falta assignmentId
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearAndGroup(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty('status', false);
      expect(data).toHaveProperty(
        'message',
        'Faltan parámetros requeridos: studentId, yearId o assignmentId.'
      );
    });

    it('debe retornar 404 si no hay registros', async () => {
      db.OverallCourseAverage.findAll.mockResolvedValue([]);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-assignment',
        query: { yearId: '2025', assignmentId: '10' },
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearAndGroup(req, res);

      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('status', false);
      expect(data).toHaveProperty(
        'message',
        'No se encontraron promedios generales para los filtros seleccionados.'
      );
    });

    it('debe retornar 200 y datos si hay registros', async () => {
      const mockRecords = [{ id: 1, courseAverage: '14.50' }];
      db.OverallCourseAverage.findAll.mockResolvedValue(mockRecords);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-assignment',
        query: { yearId: '2025', assignmentId: '10' },
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearAndGroup(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty('status', true);
      expect(data).toHaveProperty(
        'message',
        'Promedios generales por cursos encontrados.'
      );
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toEqual(mockRecords);
    });

    it('debe manejar error interno con 500', async () => {
      db.OverallCourseAverage.findAll.mockRejectedValue(
        new Error('Error en BD')
      );

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-assignment',
        query: { yearId: '2025', assignmentId: '10' },
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearAndGroup(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getOverallCourseAverageByYearGroupAndStudent ----------
  describe('getOverallCourseAverageByYearGroupAndStudent', () => {
    it('debe retornar 400 si faltan parámetros', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-SYA',
        query: { studentId: '1', yearId: '2025' }, // falta assignmentId
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearGroupAndStudent(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty('status', false);
      expect(data).toHaveProperty(
        'message',
        'Faltan parámetros requeridos (estudiante, año o asignación).'
      );
    });

    it('debe retornar 404 si no hay registros', async () => {
      db.OverallCourseAverage.findAll.mockResolvedValue([]);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-SYA',
        query: { studentId: '1', yearId: '2025', assignmentId: '10' },
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearGroupAndStudent(req, res);

      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('status', false);
      expect(data).toHaveProperty(
        'message',
        'No se encontraron promedios generales para los filtros seleccionados.'
      );
    });

    it('debe retornar 200 y datos si hay registros', async () => {
      const mockRecords = [{ id: 1, courseAverage: '17.00' }];
      db.OverallCourseAverage.findAll.mockResolvedValue(mockRecords);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-SYA',
        query: { studentId: '1', yearId: '2025', assignmentId: '10' },
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearGroupAndStudent(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty('status', true);
      expect(data).toHaveProperty(
        'message',
        'Promedios generales por cursos encontrados.'
      );
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toEqual(mockRecords);
    });

    it('debe manejar error interno con 500', async () => {
      db.OverallCourseAverage.findAll.mockRejectedValue(
        new Error('Error interno')
      );

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/generalAvarage/by-SYA',
        query: { studentId: '1', yearId: '2025', assignmentId: '10' },
      });
      const res = httpMocks.createResponse();

      await controller.getOverallCourseAverageByYearGroupAndStudent(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });
});
