// test/unit.test/studentEnrollments.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/studentEnrollments.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  StudentEnrollments: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  Persons: {},
  Years: {},
  Grades: {},
  Sections: {},
  Schedules: {
    findByPk: jest.fn(),
  },
  TeacherGroups: {
    findByPk: jest.fn(),
  },
  Tutors: {
    findOne: jest.fn(),
  },
}));

describe('StudentEnrollments Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createStudentEnrollment ----------
  it('createStudentEnrollment debe retornar 400 si faltan campos', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        studentId: 1,
        yearId: null,
        gradeId: 1,
        sectionId: 1,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createStudentEnrollment(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty('error', 'No ha completado algunos campos');
  });

  it('createStudentEnrollment debe crear y retornar 201', async () => {
    const fakeEnrollment = { id: 1, studentId: 1, yearId: 1, gradeId: 1, sectionId: 1 };
    db.StudentEnrollments.create.mockResolvedValue(fakeEnrollment);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        studentId: 1,
        yearId: 1,
        gradeId: 1,
        sectionId: 1,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createStudentEnrollment(req, res);

    expect(db.StudentEnrollments.create).toHaveBeenCalledWith({
      studentId: 1,
      yearId: 1,
      gradeId: 1,
      sectionId: 1,
    });
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data).toEqual(fakeEnrollment);
  });

  it('createStudentEnrollment debe manejar error 500', async () => {
    db.StudentEnrollments.create.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        studentId: 1,
        yearId: 1,
        gradeId: 1,
        sectionId: 1,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createStudentEnrollment(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getStudentEnrollments ----------
  it('getStudentEnrollments debe devolver lista', async () => {
    const fakeList = [{ id: 1 }, { id: 2 }];
    db.StudentEnrollments.findAll.mockResolvedValue(fakeList);

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await controller.getStudentEnrollments(req, res);

    expect(db.StudentEnrollments.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual(fakeList);
  });

  it('getStudentEnrollments debe manejar error 500', async () => {
    db.StudentEnrollments.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await controller.getStudentEnrollments(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getStudentsBySchedule ----------
  it('getStudentsBySchedule debe retornar 400 si no hay scheduleId', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { scheduleId: undefined },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsBySchedule(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'El identificador del horario es requerido');
  });

  it('getStudentsBySchedule debe retornar 404 si el horario no existe', async () => {
    db.Schedules.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { scheduleId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsBySchedule(req, res);

    expect(db.Schedules.findByPk).toHaveBeenCalledWith('1');
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Horario no encontrado');
  });

  it('getStudentsBySchedule debe retornar 200 con estudiantes', async () => {
    const mockSchedule = { id: 1, gradeId: 1, sectionId: 2, yearId: 3 };
    db.Schedules.findByPk.mockResolvedValue(mockSchedule);

    const fakeStudents = [{ id: 10 }, { id: 11 }];
    db.StudentEnrollments.findAll.mockResolvedValue(fakeStudents);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { scheduleId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsBySchedule(req, res);

    expect(db.Schedules.findByPk).toHaveBeenCalledWith('1');
    expect(db.StudentEnrollments.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual(fakeStudents);
  });

  it('getStudentsBySchedule debe manejar error 500', async () => {
    db.Schedules.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { scheduleId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsBySchedule(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getStudentsByGroup ----------
  it('getStudentsByGroup debe retornar 400 si no hay asigmentId', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { asigmentId: undefined },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsByGroup(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'El identificador del grupo es requerido');
  });

  it('getStudentsByGroup debe retornar 404 si grupo no existe', async () => {
    db.TeacherGroups.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { asigmentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsByGroup(req, res);

    expect(db.TeacherGroups.findByPk).toHaveBeenCalledWith('1');
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Grupo no encontrado');
  });

  it('getStudentsByGroup debe retornar 200 con estudiantes', async () => {
    const mockGroup = { id: 1, gradeId: 1, sectionId: 2, yearId: 3 };
    db.TeacherGroups.findByPk.mockResolvedValue(mockGroup);

    const fakeStudents = [{ id: 10 }, { id: 11 }];
    db.StudentEnrollments.findAll.mockResolvedValue(fakeStudents);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { asigmentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsByGroup(req, res);

    expect(db.TeacherGroups.findByPk).toHaveBeenCalledWith('1');
    expect(db.StudentEnrollments.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual(fakeStudents);
  });

  it('getStudentsByGroup debe manejar error 500', async () => {
    db.TeacherGroups.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { asigmentId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsByGroup(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getStudentsByTutorGroup ----------
  it('getStudentsByTutorGroup debe retornar 400 si falta tutorId o yearId', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { tutorId: null, yearId: null },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsByTutorGroup(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'No ha seleccionado un año o tutor.');
  });

  it('getStudentsByTutorGroup debe retornar 404 si grupo tutor no existe', async () => {
    db.Tutors.findOne.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { tutorId: '1', yearId: '2024' },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsByTutorGroup(req, res);

    expect(db.Tutors.findOne).toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Grupo de tutor no encontrado para ese año.'
    );
  });

  it('getStudentsByTutorGroup debe retornar 200 con estudiantes', async () => {
    const mockTutorGroup = { id: 1, gradeId: 2, sectionId: 3, yearId: 4, status: true };
    db.Tutors.findOne.mockResolvedValue(mockTutorGroup);

    const fakeStudents = [{ id: 20 }, { id: 21 }];
    db.StudentEnrollments.findAll.mockResolvedValue(fakeStudents);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { tutorId: '1', yearId: '2024' },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsByTutorGroup(req, res);

    expect(db.Tutors.findOne).toHaveBeenCalled();
    expect(db.StudentEnrollments.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual(fakeStudents);
  });

  it('getStudentsByTutorGroup debe manejar error 500', async () => {
    db.Tutors.findOne.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { tutorId: '1', yearId: '2024' },
    });
    const res = httpMocks.createResponse();

    await controller.getStudentsByTutorGroup(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- updateStudentEnrollment ----------
  it('updateStudentEnrollment debe retornar 404 si no encuentra matrícula', async () => {
    db.StudentEnrollments.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { studentId: 1, yearId: 1, gradeId: 1, sectionId: 1 },
    });
    const res = httpMocks.createResponse();

    await controller.updateStudentEnrollment(req, res);

    expect(db.StudentEnrollments.findByPk).toHaveBeenCalledWith('1');
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Estudiante no encontrado.');
  });

  it('updateStudentEnrollment debe actualizar y retornar 200', async () => {
    const mockEnrollment = {
      id: 1,
      studentId: 10,
      yearId: 2024,
      gradeId: 2,
      sectionId: 3,
      save: jest.fn().mockResolvedValue(),
    };
    db.StudentEnrollments.findByPk.mockResolvedValue(mockEnrollment);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { studentId: 20, yearId: 2025, gradeId: 3, sectionId: 4 },
    });
    const res = httpMocks.createResponse();

    await controller.updateStudentEnrollment(req, res);

    expect(db.StudentEnrollments.findByPk).toHaveBeenCalledWith('1');
    expect(mockEnrollment.studentId).toBe(20);
    expect(mockEnrollment.yearId).toBe(2025);
    expect(mockEnrollment.gradeId).toBe(3);
    expect(mockEnrollment.sectionId).toBe(4);
    expect(mockEnrollment.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.studentId).toBe(20);
  });

  it('updateStudentEnrollment debe manejar error 500', async () => {
    db.StudentEnrollments.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: { studentId: 20, yearId: 2025, gradeId: 3, sectionId: 4 },
    });
    const res = httpMocks.createResponse();

    await controller.updateStudentEnrollment(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- deleteStudentEnrollment ----------
  it('deleteStudentEnrollment debe retornar 400 si id inválido', async () => {
    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: 'abc' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteStudentEnrollment(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Identificador inválido o no proporcionado.'
    );
  });

  it('deleteStudentEnrollment debe retornar 404 si no se elimina nada', async () => {
    db.StudentEnrollments.destroy.mockResolvedValue(0);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteStudentEnrollment(req, res);

    expect(db.StudentEnrollments.destroy).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Estudiante no encontrado.');
  });

  it('deleteStudentEnrollment debe retornar 200 si elimina', async () => {
    db.StudentEnrollments.destroy.mockResolvedValue(1);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteStudentEnrollment(req, res);

    expect(db.StudentEnrollments.destroy).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Estudiante eliminado correctamente.'
    );
  });

  it('deleteStudentEnrollment debe manejar error 500', async () => {
    db.StudentEnrollments.destroy.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteStudentEnrollment(req, res);

    expect(res.statusCode).toBe(500);
  });
});
