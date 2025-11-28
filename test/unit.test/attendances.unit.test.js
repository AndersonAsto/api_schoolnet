const { Op } = require('sequelize');
const attendancesController = require('../../controllers/attendances.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  sequelize: {
    transaction: jest.fn(),
  },
  Attendances: {
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  StudentEnrollments: {
    findAll: jest.fn(),
  },
  TeacherGroups: {
    findByPk: jest.fn(),
  },
  Schedules: {
    findAll: jest.fn(),
  },
  SchoolDays: {},
  Persons: {},
  Years: {},
}));

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Attendances Controller - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- bulkCreateAttendances ----------
  describe('bulkCreateAttendances', () => {
    it('debe devolver 400 si no se envían asistencias', async () => {
      const req = { body: [] };
      const res = mockResponse();

      await attendancesController.bulkCreateAttendances(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'No se enviaron asistencias.' });
    });

    it('debe crear asistencias y devolver 201', async () => {
      const attendances = [
        { assistance: true, studentId: 1, scheduleId: 1, schoolDayId: 1 },
      ];
      const req = { body: attendances };
      const res = mockResponse();

      db.Attendances.bulkCreate.mockResolvedValue();

      await attendancesController.bulkCreateAttendances(req, res);

      expect(db.Attendances.bulkCreate).toHaveBeenCalledWith(attendances);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Asistencias registradas correctamente.',
      });
    });

    it('debe manejar error interno con 500', async () => {
      const attendances = [
        { assistance: true, studentId: 1, scheduleId: 1, schoolDayId: 1 },
      ];
      const req = { body: attendances };
      const res = mockResponse();

      db.Attendances.bulkCreate.mockRejectedValue(new Error('DB error'));

      await attendancesController.bulkCreateAttendances(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.',
      });
    });
  });

  // ---------- getAttendances ----------
  describe('getAttendances', () => {
    it('debe devolver 200 con lista de asistencias', async () => {
      const req = {};
      const res = mockResponse();

      const fakeAttendances = [{ id: 1 }, { id: 2 }];
      db.Attendances.findAll.mockResolvedValue(fakeAttendances);

      await attendancesController.getAttendances(req, res);

      expect(db.Attendances.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeAttendances);
    });

    it('debe manejar error interno con 500', async () => {
      const req = {};
      const res = mockResponse();

      db.Attendances.findAll.mockRejectedValue(new Error('DB error'));

      await attendancesController.getAttendances(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.',
      });
    });
  });

  // ---------- bulkUpdateAttendances ----------
  describe('bulkUpdateAttendances', () => {
    it('debe devolver 400 si no hay datos para actualizar', async () => {
      const req = { body: [] };
      const res = mockResponse();

      await attendancesController.bulkUpdateAttendances(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: 'No hay datos para actualizar.',
      });
    });

    it('debe actualizar asistencias correctamente y devolver status true', async () => {
      const updates = [
        {
          id: 1,
          assistance: true,
          assistanceDetail: null,
          scheduleId: 1,
          schoolDayId: 1,
          studentId: 1,
        },
        {
          id: 2,
          assistance: false,
          assistanceDetail: 'Falta injustificada',
          scheduleId: 1,
          schoolDayId: 1,
          studentId: 2,
        },
      ];
      const req = { body: updates };
      const res = mockResponse();

      const commit = jest.fn();
      const rollback = jest.fn();
      db.sequelize.transaction.mockResolvedValue({ commit, rollback });
      db.Attendances.update.mockResolvedValue([1]);

      await attendancesController.bulkUpdateAttendances(req, res);

      expect(db.sequelize.transaction).toHaveBeenCalled();
      expect(db.Attendances.update).toHaveBeenCalledTimes(2);
      expect(commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        message: 'Asistencias actualizadas correctamente',
      });
    });

    it('debe lanzar error si algún registro no tiene id y responder 500', async () => {
      const updates = [
        {
          assistance: true,
          scheduleId: 1,
          schoolDayId: 1,
          studentId: 1,
        },
      ];
      const req = { body: updates };
      const res = mockResponse();

      const commit = jest.fn();
      const rollback = jest.fn();
      db.sequelize.transaction.mockResolvedValue({ commit, rollback });

      await attendancesController.bulkUpdateAttendances(req, res);

      expect(rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.',
      });
    });

    it('debe manejar error interno en la transacción y devolver 500', async () => {
      const updates = [
        {
          id: 1,
          assistance: true,
          scheduleId: 1,
          schoolDayId: 1,
          studentId: 1,
        },
      ];
      const req = { body: updates };
      const res = mockResponse();

      const commit = jest.fn();
      const rollback = jest.fn();
      db.sequelize.transaction.mockResolvedValue({ commit, rollback });

      db.Attendances.update.mockRejectedValue(new Error('DB error'));

      await attendancesController.bulkUpdateAttendances(req, res);

      expect(rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.',
      });
    });
  });

  // ---------- getAttendancesByScheduleAndDay ----------
  describe('getAttendancesByScheduleAndDay', () => {
    it('debe devolver 400 si faltan scheduleId o schoolDayId', async () => {
      const req = { query: { scheduleId: 1 } }; // falta schoolDayId
      const res = mockResponse();

      await attendancesController.getAttendancesByScheduleAndDay(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: 'Faltan parámetros: scheduleId y schoolDayId son requeridos',
      });
    });

    it('debe devolver lista de asistencias filtradas', async () => {
      const req = { query: { scheduleId: '1', schoolDayId: '2' } };
      const res = mockResponse();

      const fakeAssistances = [{ id: 1 }, { id: 2 }];
      db.Attendances.findAll.mockResolvedValue(fakeAssistances);

      await attendancesController.getAttendancesByScheduleAndDay(req, res);

      expect(db.Attendances.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(fakeAssistances);
    });

    it('debe manejar error interno con 500', async () => {
      const req = { query: { scheduleId: '1', schoolDayId: '2' } };
      const res = mockResponse();

      db.Attendances.findAll.mockRejectedValue(new Error('DB error'));

      await attendancesController.getAttendancesByScheduleAndDay(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.',
      });
    });
  });

  // ---------- getAttendancesByScheduleAndStudent ----------
  describe('getAttendancesByScheduleAndStudent', () => {
    it('debe devolver mensaje si no hay asistencias para el estudiante', async () => {
      const req = { params: { studentId: 1, scheduleId: 1 } };
      const res = mockResponse();

      db.Attendances.findAll.mockResolvedValue([]);

      await attendancesController.getAttendancesByScheduleAndStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No se encontraron asistencias para este estudiante.',
      });
    });

    it('debe devolver lista de asistencias cuando existen', async () => {
      const req = { params: { studentId: 1, scheduleId: 1 } };
      const res = mockResponse();

      const fakeAssistances = [{ id: 1 }, { id: 2 }];
      db.Attendances.findAll.mockResolvedValue(fakeAssistances);

      await attendancesController.getAttendancesByScheduleAndStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeAssistances);
    });

    it('debe manejar error interno con 500', async () => {
      const req = { params: { studentId: 1, scheduleId: 1 } };
      const res = mockResponse();

      db.Attendances.findAll.mockRejectedValue(new Error('DB error'));

      await attendancesController.getAttendancesByScheduleAndStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.',
      });
    });
  });

  // ---------- getAttendancesByGroupAndStudent ----------
  describe('getAttendancesByGroupAndStudent', () => {
    it('debe devolver 404 si el grupo de docente no existe', async () => {
      const req = { params: { teacherGroupId: 1, studentId: 1 } };
      const res = mockResponse();

      db.TeacherGroups.findByPk.mockResolvedValue(null);

      await attendancesController.getAttendancesByGroupAndStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Grupo de docente no encontrado',
      });
    });

    it('debe devolver 404 si no se encuentran horarios para el grupo', async () => {
      const req = { params: { teacherGroupId: 1, studentId: 1 } };
      const res = mockResponse();

      const fakeGroup = {
        id: 1,
        courseId: 1,
        gradeId: 1,
        sectionId: 1,
        yearId: 2024,
      };
      db.TeacherGroups.findByPk.mockResolvedValue(fakeGroup);
      db.Schedules.findAll.mockResolvedValue([]);

      await attendancesController.getAttendancesByGroupAndStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No se encontraron horarios para este grupo',
      });
    });

    it('debe devolver lista de asistencias cuando hay datos', async () => {
      const req = { params: { teacherGroupId: 1, studentId: 1 } };
      const res = mockResponse();

      const fakeGroup = {
        id: 1,
        courseId: 1,
        gradeId: 1,
        sectionId: 1,
        yearId: 2024,
      };
      db.TeacherGroups.findByPk.mockResolvedValue(fakeGroup);

      const fakeSchedules = [
        { id: 10 },
        { id: 11 },
      ];
      db.Schedules.findAll.mockResolvedValue(fakeSchedules);

      const fakeAssistances = [
        { id: 1 },
        { id: 2 },
      ];
      db.Attendances.findAll.mockResolvedValue(fakeAssistances);

      await attendancesController.getAttendancesByGroupAndStudent(req, res);

      expect(db.Attendances.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(fakeAssistances);
    });

    it('debe manejar error interno con 500', async () => {
      const req = { params: { teacherGroupId: 1, studentId: 1 } };
      const res = mockResponse();

      db.TeacherGroups.findByPk.mockRejectedValue(new Error('DB error'));

      await attendancesController.getAttendancesByGroupAndStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor. Inténtelo de nuevo más tarde.',
      });
    });
  });
});
