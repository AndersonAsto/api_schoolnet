// test/schedule.unit.test.js
const {createSchedule} = require('../controllers/schedules.controller');
const Schedules = require('../models/schedules.model');

jest.mock('../models/schedules.model'); // Simulamos el modelo

describe('Pruebas Unitarias - createSchedule', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                yearId: 1,
                teacherId: 1,
                courseId: 1,
                gradeId: 1,
                sectionId: 1,
                weekday: 'Lunes',
                startTime: '08:00:00',
                endTime: '09:00:00'
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it('✅ debería crear un horario correctamente', async () => {
        const mockSchedule = {id: 1, ...req.body};
        Schedules.create.mockResolvedValue(mockSchedule);

        await createSchedule(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockSchedule);
    });

    it('❌ debería devolver error si faltan campos requeridos', async () => {
        req.body = {}; // sin datos
        await createSchedule(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('💥 debería capturar un error del servidor', async () => {
        Schedules.create.mockRejectedValue(new Error('DB error'));

        await createSchedule(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
