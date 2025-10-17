const CoursesController = require('../controllers/courses.controller');
const Courses = require('../models/courses.model');

// Mock del modelo Sequelize
jest.mock('../models/courses.model');

describe('Courses Controller', () => {

  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  // ---- CREATE ----
  describe('createCourse', () => {
    it('debería crear un curso exitosamente', async () => {
      req.body = { course: 'Matemáticas', descripcion: 'Curso básico' };
      const mockCourse = { id: 1, ...req.body };
      Courses.create.mockResolvedValue(mockCourse);

      await CoursesController.createCourse(req, res);

      expect(Courses.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCourse);
    });

    it('debería devolver 400 si falta el campo course', async () => {
      req.body = { descripcion: 'Sin nombre' };

      await CoursesController.createCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No ha completado los campos requeridos.' });
    });

    it('debería manejar errores internos', async () => {
      req.body = { course: 'Matemáticas', descripcion: 'Error test' };
      Courses.create.mockRejectedValue(new Error('DB error'));

      await CoursesController.createCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error al crear curso'
      }));
    });
  });

  // ---- GET ----
  describe('getCourses', () => {
    it('debería obtener la lista de cursos', async () => {
      const mockCourses = [{ id: 1, course: 'Matemáticas' }];
      Courses.findAll.mockResolvedValue(mockCourses);

      await CoursesController.getCourses(req, res);

      expect(Courses.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockCourses);
    });

    it('debería manejar errores al obtener cursos', async () => {
      Courses.findAll.mockRejectedValue(new Error('DB error'));

      await CoursesController.getCourses(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error al obtener cursos'
      }));
    });
  });

  // ---- UPDATE ----
  describe('updateCourse', () => {
    it('debería actualizar un curso existente', async () => {
      req.params.id = 1;
      req.body = { course: 'Física', descripcion: 'Avanzado' };
      const mockCourse = { id: 1, save: jest.fn(), course: '', descripcion: '' };

      Courses.findByPk.mockResolvedValue(mockCourse);

      await CoursesController.updateCourse(req, res);

      expect(mockCourse.course).toBe('Física');
      expect(mockCourse.descripcion).toBe('Avanzado');
      expect(mockCourse.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCourse);
    });

    it('debería devolver 404 si el curso no existe', async () => {
      req.params.id = 99;
      Courses.findByPk.mockResolvedValue(null);

      await CoursesController.updateCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Curso no encontrado' });
    });
  });

  // ---- DELETE ----
  describe('deleteCourseById', () => {
    it('debería eliminar un curso existente', async () => {
      req.params.id = 1;
      Courses.destroy.mockResolvedValue(1);

      await CoursesController.deleteCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Curso eliminado correctamente' });
    });

    it('debería devolver 404 si el curso no existe', async () => {
      req.params.id = 999;
      Courses.destroy.mockResolvedValue(0);

      await CoursesController.deleteCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Curso no encontrado' });
    });
  });

});
