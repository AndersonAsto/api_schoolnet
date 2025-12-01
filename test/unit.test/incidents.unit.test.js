// test/unit.test/incidents.unit.test.js
const httpMocks = require('node-mocks-http');
const incidentsController = require('../../controllers/incidents.controller');
const db = require('../../models');

jest.mock('../../models', () => ({
  Incidents: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  StudentEnrollments: {},
  StudentsEnrollments: {}, // para el typo dentro del controlador
  Persons: {},
  Grades: {},
  Sections: {},
  Schedules: {},
  SchoolDays: {},
}));

describe('Incidents Controller - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createIncident ----------
  describe('createIncident', () => {
    it('debe retornar 400 si faltan campos obligatorios', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/incidents/create',
        body: {
          studentId: 1,
          // falta scheduleId y/o schoolDayId
        },
      });
      const res = httpMocks.createResponse();

      await incidentsController.createIncident(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Los campos studentId, scheduleId y schoolDayId son obligatorios.'
      );
      expect(db.Incidents.create).not.toHaveBeenCalled();
    });

    it('debe crear una incidencia y retornar 201', async () => {
      const mockIncident = {
        id: 1,
        studentId: 1,
        scheduleId: 2,
        schoolDayId: 3,
        incidentDetail: 'Incidencia de prueba',
      };
      db.Incidents.create.mockResolvedValue(mockIncident);

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/incidents/create',
        body: {
          studentId: 1,
          scheduleId: 2,
          schoolDayId: 3,
          incidentDetail: 'Incidencia de prueba',
        },
      });
      const res = httpMocks.createResponse();

      await incidentsController.createIncident(req, res);

      expect(db.Incidents.create).toHaveBeenCalledWith({
        studentId: 1,
        scheduleId: 2,
        schoolDayId: 3,
        incidentDetail: 'Incidencia de prueba',
      });
      expect(res.statusCode).toBe(201);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Incidencia registrada correctamente.'
      );
      expect(data).toHaveProperty('data');
      expect(data.data).toEqual(mockIncident);
    });

    it('debe manejar errores internos con 500', async () => {
      db.Incidents.create.mockRejectedValue(new Error('Error en BD'));

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/incidents/create',
        body: {
          studentId: 1,
          scheduleId: 2,
          schoolDayId: 3,
          incidentDetail: 'Incidencia de prueba',
        },
      });
      const res = httpMocks.createResponse();

      await incidentsController.createIncident(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getIncidents ----------
  describe('getIncidents', () => {
    it('debe listar incidencias con include y mensaje correcto', async () => {
      const mockIncidents = [
        {
          id: 1,
          studentId: 1,
          scheduleId: 2,
          schoolDayId: 3,
          incidentDetail: 'Incidencia de prueba',
        },
      ];
      db.Incidents.findAll.mockResolvedValue(mockIncidents);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/incidents/list',
      });
      const res = httpMocks.createResponse();

      await incidentsController.getIncidents(req, res);

      expect(db.Incidents.findAll).toHaveBeenCalledWith({
        include: [
          {
            model: db.StudentEnrollments,
            as: 'students',
            include: [
              {
                model: db.Persons,
                as: 'persons',
                attributes: ['names', 'lastNames', 'dni'],
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
          {
            model: db.Schedules,
            as: 'schedules',
            include: [
              {
                model: db.Courses,
                as: 'courses',
                attributes: ['course'],
              },
            ],
          },
          {
            model: db.SchoolDays,
            as: 'schooldays',
            attributes: ['id', 'teachingDay'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Lista de incidencias obtenida correctamente.'
      );
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toEqual(mockIncidents);
    });

    it('debe manejar errores internos con 500', async () => {
      db.Incidents.findAll.mockRejectedValue(new Error('Error interno'));

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/incidents/list',
      });
      const res = httpMocks.createResponse();

      await incidentsController.getIncidents(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- updateIncident ----------
  describe('updateIncident', () => {
    it('debe retornar 404 si la incidencia no existe', async () => {
      db.Incidents.findByPk.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/incidents/update/1',
        params: { id: '1' },
        body: {
          studentId: 2,
          scheduleId: 3,
          schoolDayId: 4,
          incidentDetail: 'Actualizada',
        },
      });
      const res = httpMocks.createResponse();

      await incidentsController.updateIncident(req, res);

      expect(db.Incidents.findByPk).toHaveBeenCalledWith('1');
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Incidente no encontrado.');
    });

    it('debe actualizar incidencia y devolver 200', async () => {
      const mockInstance = {
        id: 1,
        studentId: 1,
        scheduleId: 2,
        schoolDayId: 3,
        incidentDetail: 'Original',
        save: jest.fn().mockResolvedValue(true),
      };
      db.Incidents.findByPk.mockResolvedValue(mockInstance);

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/incidents/update/1',
        params: { id: '1' },
        body: {
          studentId: 10,
          scheduleId: 20,
          schoolDayId: 30,
          incidentDetail: 'Actualizada',
        },
      });
      const res = httpMocks.createResponse();

      await incidentsController.updateIncident(req, res);

      expect(db.Incidents.findByPk).toHaveBeenCalledWith('1');
      expect(mockInstance.studentId).toBe(10);
      expect(mockInstance.scheduleId).toBe(20);
      expect(mockInstance.schoolDayId).toBe(30);
      expect(mockInstance.incidentDetail).toBe('Actualizada');
      expect(mockInstance.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();

      expect(data).toMatchObject({
        id: 1,
        studentId: 10,
        scheduleId: 20,
        schoolDayId: 30,
        incidentDetail: 'Actualizada',
      });
    });

    it('debe manejar errores internos con 500', async () => {
      db.Incidents.findByPk.mockRejectedValue(new Error('Error en BD'));

      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/incidents/update/1',
        params: { id: '1' },
        body: {
          studentId: 10,
          scheduleId: 20,
          schoolDayId: 30,
          incidentDetail: 'Actualizada',
        },
      });
      const res = httpMocks.createResponse();

      await incidentsController.updateIncident(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- getIncidentsByScheduleAndStudent ----------
  describe('getIncidentsByScheduleAndStudent', () => {
    it('debe retornar incidencias filtradas por studentId y scheduleId', async () => {
      const mockIncidents = [
        {
          id: 1,
          studentId: 1,
          scheduleId: 2,
          schoolDayId: 3,
          incidentDetail: 'Incidencia filtrada',
        },
      ];
      db.Incidents.findAll.mockResolvedValue(mockIncidents);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/incidents/byStudentAndSchedule/1/2',
        params: { studentId: '1', scheduleId: '2' },
      });
      const res = httpMocks.createResponse();

      await incidentsController.getIncidentsByScheduleAndStudent(req, res);

      expect(db.Incidents.findAll).toHaveBeenCalledWith({
        where: { studentId: '1', scheduleId: '2' },
        include: [
          {
            model: db.StudentsEnrollments,
            as: 'students',
            include: [
              {
                model: db.Persons,
                as: 'persons',
                attributes: ['names', 'lastNames'],
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
          { model: db.SchoolDays, as: 'schooldays', attributes: ['teachingDay'] },
          {
            model: db.Schedules,
            as: 'schedules',
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
        order: [[{ model: db.SchoolDays, as: 'schooldays' }, 'teachingDay', 'ASC']],
      });

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toEqual(mockIncidents);
    });

    it('debe manejar errores internos con 500', async () => {
      db.Incidents.findAll.mockRejectedValue(new Error('Error en findAll'));

      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/incidents/byStudentAndSchedule/1/2',
        params: { studentId: '1', scheduleId: '2' },
      });
      const res = httpMocks.createResponse();

      await incidentsController.getIncidentsByScheduleAndStudent(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });

  // ---------- deleteIncident (solo unitario) ----------
  describe('deleteIncident', () => {
    const { deleteIncident } = require('../../controllers/incidents.controller');

    it('debe retornar 400 si el id es inválido', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/incidents/delete/abc',
        params: { id: 'abc' },
      });
      const res = httpMocks.createResponse();

      await deleteIncident(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Identificador inválido o no proporcionado.'
      );
      expect(db.Incidents.destroy).not.toHaveBeenCalled();
    });

    it('debe retornar 404 si la incidencia no existe', async () => {
      db.Incidents.destroy.mockResolvedValue(0);

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/incidents/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await deleteIncident(req, res);

      expect(db.Incidents.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.statusCode).toBe(404);
      const data = res._getJSONData();
      expect(data).toHaveProperty('message', 'Incidencia no encontrada.');
    });

    it('debe eliminar incidencia y retornar 200', async () => {
      db.Incidents.destroy.mockResolvedValue(1);

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/incidents/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await deleteIncident(req, res);

      expect(db.Incidents.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Incidencia eliminada correctamente.'
      );
    });

    it('debe manejar errores internos con 500', async () => {
      db.Incidents.destroy.mockRejectedValue(new Error('Error en destroy'));

      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/incidents/delete/1',
        params: { id: '1' },
      });
      const res = httpMocks.createResponse();

      await deleteIncident(req, res);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data).toHaveProperty(
        'message',
        'Error interno del servidor. Inténtelo de nuevo más tarde.'
      );
    });
  });
});
