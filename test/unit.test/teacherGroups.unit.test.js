// test/unit.test/teacherGroups.unit.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/teacherGroups.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  TeacherGroups: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  TeacherAssignments: {
    findOne: jest.fn(),
  },
  Users: {
    findByPk: jest.fn(),
  },
  Persons: {
    findByPk: jest.fn(),
  },
  Tutors: {
    findByPk: jest.fn(),
  },
  Years: {},
  Grades: {},
  Sections: {},
  Courses: {},
}));

describe('TeacherGroups Controller - Unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createTeacherGroup ----------
  it('createTeacherGroup debe retornar 400 si faltan campos requeridos', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        teacherAssignmentId: 1,
        yearId: 1,
        courseId: null,
        gradeId: 1,
        sectionId: 1,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createTeacherGroup(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'No se han completado los campos requeridos. '
    );
  });

  it('createTeacherGroup debe crear y retornar 201', async () => {
    const fakeGroup = {
      id: 1,
      teacherAssignmentId: 1,
      yearId: 1,
      courseId: 1,
      gradeId: 1,
      sectionId: 1,
    };
    db.TeacherGroups.create.mockResolvedValue(fakeGroup);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        teacherAssignmentId: 1,
        yearId: 1,
        courseId: 1,
        gradeId: 1,
        sectionId: 1,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createTeacherGroup(req, res);

    expect(db.TeacherGroups.create).toHaveBeenCalledWith({
      teacherAssignmentId: 1,
      yearId: 1,
      courseId: 1,
      gradeId: 1,
      sectionId: 1,
    });
    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data).toEqual(fakeGroup);
  });

  it('createTeacherGroup debe manejar error 500', async () => {
    db.TeacherGroups.create.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        teacherAssignmentId: 1,
        yearId: 1,
        courseId: 1,
        gradeId: 1,
        sectionId: 1,
      },
    });
    const res = httpMocks.createResponse();

    await controller.createTeacherGroup(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTeacherGroups ----------
  it('getTeacherGroups debe devolver lista', async () => {
    const fakeList = [{ id: 1 }, { id: 2 }];
    db.TeacherGroups.findAll.mockResolvedValue(fakeList);

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroups(req, res);

    expect(db.TeacherGroups.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual(fakeList);
  });

  it('getTeacherGroups debe manejar error 500', async () => {
    db.TeacherGroups.findAll.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroups(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTeacherGroupsByYearAndUser ----------
  it('getTeacherGroupsByYearAndUser debe retornar 400 si faltan parámetros', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { userId: null, yearId: null },
    });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroupsByYearAndUser(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'El identificador del usuario y del año son requeridos'
    );
  });

  it('getTeacherGroupsByYearAndUser debe retornar 404 si usuario no existe', async () => {
    db.Users.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { userId: '1', yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroupsByYearAndUser(req, res);

    expect(db.Users.findByPk).toHaveBeenCalledWith('1');
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Usuario no encontrado');
  });

  it('getTeacherGroupsByYearAndUser debe retornar 404 si persona no existe', async () => {
    db.Users.findByPk.mockResolvedValue({ id: 1, personId: 99 });
    db.Persons.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { userId: '1', yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroupsByYearAndUser(req, res);

    expect(db.Persons.findByPk).toHaveBeenCalledWith(99);
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Persona asociada no encontrada');
  });

  it('getTeacherGroupsByYearAndUser debe retornar 404 si no hay asignación docente', async () => {
    db.Users.findByPk.mockResolvedValue({ id: 1, personId: 10 });
    db.Persons.findByPk.mockResolvedValue({ id: 10 });
    db.TeacherAssignments.findOne.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { userId: '1', yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroupsByYearAndUser(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'No se encontró asignación de docente'
    );
  });

  it('getTeacherGroupsByYearAndUser debe devolver lista si todo ok', async () => {
    db.Users.findByPk.mockResolvedValue({ id: 1, personId: 10 });
    db.Persons.findByPk.mockResolvedValue({ id: 10 });
    db.TeacherAssignments.findOne.mockResolvedValue({ id: 5 });
    const fakeGroups = [{ id: 1 }, { id: 2 }];
    db.TeacherGroups.findAll.mockResolvedValue(fakeGroups);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { userId: '1', yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroupsByYearAndUser(req, res);

    expect(db.TeacherGroups.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual(fakeGroups);
  });

  it('getTeacherGroupsByYearAndUser debe manejar error 500', async () => {
    db.Users.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { userId: '1', yearId: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroupsByYearAndUser(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- getTeacherGroupsByYearAndTutor ----------
  it('getTeacherGroupsByYearAndTutor debe retornar 400 si falta tutorId', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '1', tutorId: '' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroupsByYearAndTutor(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'El identificador del grupo de tutor es requerido.'
    );
  });

  it('getTeacherGroupsByYearAndTutor debe retornar 404 si grupo tutor no existe', async () => {
    db.Tutors.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '1', tutorId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroupsByYearAndTutor(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty('message', 'Grupo de tutor no encontrado.');
  });

  it('getTeacherGroupsByYearAndTutor debe devolver lista si todo ok', async () => {
    db.Tutors.findByPk.mockResolvedValue({
      id: 10,
      gradeId: 1,
      sectionId: 1,
    });
    const fakeGroups = [{ id: 1 }];
    db.TeacherGroups.findAll.mockResolvedValue(fakeGroups);

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '1', tutorId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroupsByYearAndTutor(req, res);

    expect(db.TeacherGroups.findAll).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual(fakeGroups);
  });

  it('getTeacherGroupsByYearAndTutor debe manejar error 500', async () => {
    db.Tutors.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'GET',
      params: { yearId: '1', tutorId: '10' },
    });
    const res = httpMocks.createResponse();

    await controller.getTeacherGroupsByYearAndTutor(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- updateTeacherGroup ----------
  it('updateTeacherGroup debe retornar 404 si grupo no existe', async () => {
    db.TeacherGroups.findByPk.mockResolvedValue(null);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        teacherAssignmentId: 1,
        yearId: 1,
        courseId: 1,
        gradeId: 1,
        sectionId: 1,
      },
    });
    const res = httpMocks.createResponse();

    await controller.updateTeacherGroup(req, res);

    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Grupo de docente no encontrado.'
    );
  });

  it('updateTeacherGroup debe actualizar y retornar 200', async () => {
    const mockGroup = {
      id: 1,
      teacherAssignmentId: 2,
      yearId: 2024,
      courseId: 2,
      gradeId: 2,
      sectionId: 2,
      save: jest.fn().mockResolvedValue(),
    };
    db.TeacherGroups.findByPk.mockResolvedValue(mockGroup);

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        teacherAssignmentId: 3,
        yearId: 2025,
        courseId: 4,
        gradeId: 5,
        sectionId: 6,
      },
    });
    const res = httpMocks.createResponse();

    await controller.updateTeacherGroup(req, res);

    expect(db.TeacherGroups.findByPk).toHaveBeenCalledWith('1');
    expect(mockGroup.teacherAssignmentId).toBe(3);
    expect(mockGroup.yearId).toBe(2025);
    expect(mockGroup.courseId).toBe(4);
    expect(mockGroup.gradeId).toBe(5);
    expect(mockGroup.sectionId).toBe(6);
    expect(mockGroup.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.teacherAssignmentId).toBe(3);
  });

  it('updateTeacherGroup debe manejar error 500', async () => {
    db.TeacherGroups.findByPk.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: '1' },
      body: {
        teacherAssignmentId: 3,
        yearId: 2025,
        courseId: 4,
        gradeId: 5,
        sectionId: 6,
      },
    });
    const res = httpMocks.createResponse();

    await controller.updateTeacherGroup(req, res);

    expect(res.statusCode).toBe(500);
  });

  // ---------- deleteTeacherGroup ----------
  it('deleteTeacherGroup debe retornar 400 si id inválido', async () => {
    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: 'abc' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTeacherGroup(req, res);

    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Identificador inválido o no proporcionado.'
    );
  });

  it('deleteTeacherGroup debe retornar 404 si no se elimina nada', async () => {
    db.TeacherGroups.destroy.mockResolvedValue(0);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTeacherGroup(req, res);

    expect(db.TeacherGroups.destroy).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Grupo de docente no encontrado. '
    );
  });

  it('deleteTeacherGroup debe retornar 200 si elimina', async () => {
    db.TeacherGroups.destroy.mockResolvedValue(1);

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTeacherGroup(req, res);

    expect(db.TeacherGroups.destroy).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toHaveProperty(
      'message',
      'Grupo de docente eliminado correctamente.'
    );
  });

  it('deleteTeacherGroup debe manejar error 500', async () => {
    db.TeacherGroups.destroy.mockRejectedValue(new Error('Error BD'));

    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: { id: '1' },
    });
    const res = httpMocks.createResponse();

    await controller.deleteTeacherGroup(req, res);

    expect(res.statusCode).toBe(500);
  });
});
