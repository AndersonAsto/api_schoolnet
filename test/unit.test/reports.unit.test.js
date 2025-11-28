// test/unit.test/reports.unit.test.js
const httpMocks = require('node-mocks-http');
const reportController = require('../../controllers/reports.controller');
const db = require('../../models');

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const doc = {
      page: {
        width: 842, // aprox A4 landscape
        margins: { left: 40, right: 40, top: 40, bottom: 40 },
      },
      rect: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      fillAndStroke: jest.fn().mockReturnThis(),
      fill: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      currentLineHeight: jest.fn().mockReturnValue(10),
      pipe: jest.fn(),
      end: jest.fn(),
      y: 100,
    };
    return doc;
  });
});

jest.mock('../../models', () => ({
  Years: {
    findByPk: jest.fn(),
  },
  StudentEnrollments: {
    findByPk: jest.fn(),
  },
  Persons: {},
  Grades: {},
  Sections: {},
  Tutors: {
    findOne: jest.fn(),
  },
  TeacherAssignments: {},
  OverallCourseAverage: {
    findAll: jest.fn(),
  },
  TeachingBlockAverage: {
    findAll: jest.fn(),
  },
  TeachingBlocks: {},
  AnnualAverage: {
    findOne: jest.fn(),
  },
  TeacherGroups: {},
  Courses: {},
  Sequelize: {
    literal: jest.fn((v) => v),
  },
}));

describe('Reports Controller - generateReportByYearAndStudent (Unit)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar 404 si el año no existe', async () => {
    db.Years.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentEnrollmentId: '1', yearId: '2025' },
    });
    const res = httpMocks.createResponse();

    await reportController.generateReportByYearAndStudent(req, res);

    expect(db.Years.findByPk).toHaveBeenCalledWith('2025');
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Año no encontrado');
  });

  it('debe retornar 404 si la matrícula no existe', async () => {
    db.Years.findByPk.mockResolvedValue({ id: 1, year: '2025' });
    db.StudentEnrollments.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentEnrollmentId: '10', yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await reportController.generateReportByYearAndStudent(req, res);

    expect(db.StudentEnrollments.findByPk).toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Matrícula de estudiante no encontrada'
    );
  });

  it('debe generar PDF correctamente cuando hay datos mínimos', async () => {
    // Mock Año
    db.Years.findByPk.mockResolvedValue({ id: 1, year: '2025' });

    // Mock matrícula + persona/grado/sección
    db.StudentEnrollments.findByPk.mockResolvedValue({
      id: 10,
      gradeId: 3,
      sectionId: 1,
      persons: {
        names: 'Juan',
        lastNames: 'Pérez',
      },
      grades: {
        grade: '3ro',
      },
      sections: {
        seccion: 'A',
      },
    });

    // Tutor (opcional)
    db.Tutors.findOne.mockResolvedValue({
      teachers: {
        persons: {
          names: 'Pedro',
          lastNames: 'Gómez',
        },
      },
    });

    // Promedios por curso
    db.OverallCourseAverage.findAll.mockResolvedValue([
      {
        assignmentId: 100,
        courseAverage: 14.5,
        teachergroups: {
          courses: {
            course: 'Matemática',
          },
        },
      },
    ]);

    // Bloques
    db.TeachingBlockAverage.findAll.mockResolvedValue([
      {
        assignmentId: 100,
        teachingBlockId: 1,
        dailyAvarage: 15,
        practiceAvarage: 14,
        examAvarage: 13,
        teachingBlockAvarage: 14,
      },
    ]);

    // Promedio anual
    db.AnnualAverage.findOne.mockResolvedValue({
      average: 14.2,
    });

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentEnrollmentId: '10', yearId: '1' },
    });
    const res = httpMocks.createResponse({
      eventEmitter: require('events').EventEmitter,
    });

    await reportController.generateReportByYearAndStudent(req, res);

    // Verificar headers
    expect(res.getHeader('Content-Type')).toBe('application/pdf');
    expect(res.getHeader('Content-Disposition')).toContain(
      'attachment; filename="2025-3roA_Juan_Pérez.pdf'
        .replace(/\s/g, '_')
        .replace('3roA', '3roA') // por consistencia
        .split('_')[0] // solo validamos parte del nombre
    );

    // Verificamos que terminó sin error 500
    expect(res.statusCode).toBe(200); // node-mocks-http default 200
  });

  it('debe manejar error interno con 500', async () => {
    db.Years.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { studentEnrollmentId: '1', yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await reportController.generateReportByYearAndStudent(req, res);

    expect(res.statusCode).toBe(500);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Error interno del servidor. Inténtelo de nuevo más tarde.'
    );
  });
});
