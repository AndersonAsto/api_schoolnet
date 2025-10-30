const { createStudentEnrollment } = require('../controllers/studentsEnrollments.controller');
const StudentEnrollments = require('../models/studentsEnrollments.model');

jest.mock('../models/studentsEnrollments.model'); // Simulamos el modelo

describe('Pruebas Unitarias - createStudentEnrollment', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        studentId: 1,
        yearId: 1,
        gradeId: 1,
        sectionId: 1,
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('✅ debería crear una inscripción correctamente', async () => {
    const mockEnrollment = { id: 1, ...req.body };
    StudentEnrollments.create.mockResolvedValue(mockEnrollment);

    await createStudentEnrollment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockEnrollment);
  });

  it('❌ debería devolver error si faltan campos requeridos', async () => {
    req.body = {}; // sin datos
    await createStudentEnrollment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No ha completado algunos campos' });
  });

  it('💥 debería capturar un error del servidor', async () => {
    StudentEnrollments.create.mockRejectedValue(new Error('DB error'));

    await createStudentEnrollment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
