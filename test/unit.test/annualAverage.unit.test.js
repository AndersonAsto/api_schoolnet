const { Op } = require('sequelize');
const annualAverageController = require('../../controllers/annualAverage.controller');
const db = require('../../models');

// Mock completo del módulo de modelos
jest.mock('../../models', () => ({
  OverallCourseAverage: {
    findAll: jest.fn(),
  },
  AnnualAverage: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  },
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

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AnnualAverage Controller - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- calculateAnnualAverage ----------
  describe('calculateAnnualAverage', () => {
    it('debe devolver 400 si faltan studentId o yearId', async () => {
      const req = { body: { studentId: 1 } }; // falta yearId
      const res = mockResponse();

      await annualAverageController.calculateAnnualAverage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: "Faltan parámetros requeridos: studentId o yearId."
      });
    });

    it('debe devolver 404 si no hay promedios generales del estudiante en ese año', async () => {
      const req = { body: { studentId: 1, yearId: 2024 } };
      const res = mockResponse();

      db.OverallCourseAverage.findAll.mockResolvedValue([]);

      await annualAverageController.calculateAnnualAverage(req, res);

      expect(db.OverallCourseAverage.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: "No se encontraron promedios generales para el estudiante en el año indicado."
      });
    });

    it('debe devolver 400 si el estudiante tiene menos de 10 cursos', async () => {
      const req = { body: { studentId: 1, yearId: 2024 } };
      const res = mockResponse();

      // Solo 2 cursos distintos
      const fakeCourseAverages = [
        {
          courseAverage: '15.00',
          teachergroups: { courseId: 1 }
        },
        {
          courseAverage: '16.00',
          teachergroups: { courseId: 2 }
        },
      ];

      db.OverallCourseAverage.findAll.mockResolvedValue(fakeCourseAverages);

      await annualAverageController.calculateAnnualAverage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: `El estudiante tiene solo 2 cursos registrados. Debe tener 10 para calcular el promedio anual.`
      });
    });

    it('debe crear un nuevo promedio anual si no existe (201)', async () => {
      const req = { body: { studentId: 1, yearId: 2024 } };
      const res = mockResponse();

      // 10 cursos, promedios válidos
      const fakeCourseAverages = [];
      for (let i = 1; i <= 10; i++) {
        fakeCourseAverages.push({
          courseAverage: `${10 + i}.00`, // 11..20
          teachergroups: { courseId: i },
        });
      }

      db.OverallCourseAverage.findAll.mockResolvedValue(fakeCourseAverages);
      db.AnnualAverage.findOne.mockResolvedValue(null);

      const createdRecord = {
        id: 1,
        studentId: 1,
        yearId: 2024,
        average: '15.50',
      };
      db.AnnualAverage.create.mockResolvedValue(createdRecord);

      await annualAverageController.calculateAnnualAverage(req, res);

      expect(db.OverallCourseAverage.findAll).toHaveBeenCalled();
      expect(db.AnnualAverage.findOne).toHaveBeenCalledWith({
        where: { studentId: 1, yearId: 2024 },
      });
      expect(db.AnnualAverage.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        message: "Promedio anual calculado y guardado correctamente.",
        data: createdRecord
      });
    });

    it('debe actualizar un promedio anual existente (200)', async () => {
      const req = { body: { studentId: 1, yearId: 2024 } };
      const res = mockResponse();

      const fakeCourseAverages = [];
      for (let i = 1; i <= 10; i++) {
        fakeCourseAverages.push({
          courseAverage: '10.00',
          teachergroups: { courseId: i },
        });
      }

      db.OverallCourseAverage.findAll.mockResolvedValue(fakeCourseAverages);

      const existingRecord = {
        id: 1,
        studentId: 1,
        yearId: 2024,
        average: '12.00',
        save: jest.fn().mockResolvedValue()
      };

      db.AnnualAverage.findOne.mockResolvedValue(existingRecord);

      await annualAverageController.calculateAnnualAverage(req, res);

      expect(existingRecord.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        message: "Promedio anual actualizado correctamente.",
        data: existingRecord
      });
    });

    it('debe manejar un error interno con 500', async () => {
      const req = { body: { studentId: 1, yearId: 2024 } };
      const res = mockResponse();

      db.OverallCourseAverage.findAll.mockRejectedValue(new Error('DB error'));

      await annualAverageController.calculateAnnualAverage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'
      });
    });
  });

  // ---------- getAnnualAverageByYearAndTutor ----------
  describe('getAnnualAverageByYearAndTutor', () => {
    it('debe devolver 400 si falta yearId', async () => {
      const req = { params: { tutorId: 1 } };
      const res = mockResponse();

      await annualAverageController.getAnnualAverageByYearAndTutor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "El identificador del año es requerido."
      });
    });

    it('debe devolver 400 si falta tutorId', async () => {
      const req = { params: { yearId: 2024 } };
      const res = mockResponse();

      await annualAverageController.getAnnualAverageByYearAndTutor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "El identificador del tutor es requerido."
      });
    });

    it('debe devolver 404 si el grupo de tutor no existe', async () => {
      const req = { params: { yearId: 2024, tutorId: 1 } };
      const res = mockResponse();

      db.Tutors.findByPk.mockResolvedValue(null);

      await annualAverageController.getAnnualAverageByYearAndTutor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Grupo de tutor no encontrado."
      });
    });

    it('debe devolver data vacía si no hay matriculados', async () => {
      const req = { params: { yearId: 2024, tutorId: 1 } };
      const res = mockResponse();

      const fakeTutorGroup = { id: 1, gradeId: 1, sectionId: 1 };
      db.Tutors.findByPk.mockResolvedValue(fakeTutorGroup);
      db.StudentEnrollments.findAll.mockResolvedValue([]);

      await annualAverageController.getAnnualAverageByYearAndTutor(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        message: 'No hay estudiantes matriculados para este año y grupo.',
        data: []
      });
    });

    it('debe devolver lista de promedios cuando hay datos', async () => {
      const req = { params: { yearId: 2024, tutorId: 1 } };
      const res = mockResponse();

      const fakeTutorGroup = { id: 1, gradeId: 1, sectionId: 1 };
      db.Tutors.findByPk.mockResolvedValue(fakeTutorGroup);

      const fakeEnrollments = [
        { id: 10, yearId: 2024, gradeId: 1, sectionId: 1, status: true },
      ];
      db.StudentEnrollments.findAll.mockResolvedValue(fakeEnrollments);

      const fakeAnnuals = [
        { id: 1, studentId: 10, average: '15.00' },
      ];
      db.AnnualAverage.findAll.mockResolvedValue(fakeAnnuals);

      await annualAverageController.getAnnualAverageByYearAndTutor(req, res);

      expect(db.AnnualAverage.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        message: 'Promedios anuales por año y grupo encontrados.',
        data: fakeAnnuals
      });
    });

    it('debe manejar error interno con 500', async () => {
      const req = { params: { yearId: 2024, tutorId: 1 } };
      const res = mockResponse();

      db.Tutors.findByPk.mockRejectedValue(new Error('DB error'));

      await annualAverageController.getAnnualAverageByYearAndTutor(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'
      });
    });
  });

  // ---------- getAnnualAverageByYearAndStudent ----------
  describe('getAnnualAverageByYearAndStudent', () => {
    it('debe devolver 400 si faltan parámetros', async () => {
      const req = { params: { yearId: 2024 } }; // falta studentId
      const res = mockResponse();

      await annualAverageController.getAnnualAverageByYearAndStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: 'El año y el estudiante son requeridos.'
      });
    });

    it('debe devolver 404 si no encuentra promedio anual', async () => {
      const req = { params: { yearId: 2024, studentId: 10 } };
      const res = mockResponse();

      db.AnnualAverage.findOne.mockResolvedValue(null);

      await annualAverageController.getAnnualAverageByYearAndStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: 'No se encontró promedio anual para este estudiante en ese año.'
      });
    });

    it('debe devolver 200 y el promedio anual cuando existe', async () => {
      const req = { params: { yearId: 2024, studentId: 10 } };
      const res = mockResponse();

      const fakeAnnual = { id: 1, yearId: 2024, studentId: 10, average: '14.50' };
      db.AnnualAverage.findOne.mockResolvedValue(fakeAnnual);

      await annualAverageController.getAnnualAverageByYearAndStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        message: 'Promedio anual encontrado.',
        data: fakeAnnual
      });
    });

    it('debe manejar error interno con 500', async () => {
      const req = { params: { yearId: 2024, studentId: 10 } };
      const res = mockResponse();

      db.AnnualAverage.findOne.mockRejectedValue(new Error('DB error'));

      await annualAverageController.getAnnualAverageByYearAndStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'
      });
    });
  });

  // ---------- getAnnualAverageByYearAndStudents ----------
  describe('getAnnualAverageByYearAndStudents', () => {
    it('debe devolver 400 si faltan parámetros o lista vacía', async () => {
      const req = { body: { yearId: 2024, studentIds: [] } };
      const res = mockResponse();

      await annualAverageController.getAnnualAverageByYearAndStudents(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: 'El año y la lista de estudiantes son requeridos.',
      });
    });

    it('debe devolver 404 si no hay promedios anuales', async () => {
      const req = { body: { yearId: 2024, studentIds: [1, 2] } };
      const res = mockResponse();

      db.AnnualAverage.findAll.mockResolvedValue([]);

      await annualAverageController.getAnnualAverageByYearAndStudents(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: 'No se encontraron promedios anuales para los estudiantes en ese año.',
        data: [],
      });
    });

    it('debe devolver 200 y lista de promedios cuando hay datos', async () => {
      const req = { body: { yearId: 2024, studentIds: [1, 2] } };
      const res = mockResponse();

      const fakeAnnuals = [
        { id: 1, studentId: 1, average: '15.00' },
        { id: 2, studentId: 2, average: '16.00' },
      ];

      db.AnnualAverage.findAll.mockResolvedValue(fakeAnnuals);

      await annualAverageController.getAnnualAverageByYearAndStudents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        message: 'Promedios anuales encontrados.',
        data: fakeAnnuals,
      });
    });

    it('debe manejar error interno con 500', async () => {
      const req = { body: { yearId: 2024, studentIds: [1, 2] } };
      const res = mockResponse();

      db.AnnualAverage.findAll.mockRejectedValue(new Error('DB error'));

      await annualAverageController.getAnnualAverageByYearAndStudents(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'
      });
    });
  });
});
