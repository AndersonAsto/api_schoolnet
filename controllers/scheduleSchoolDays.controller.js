const ScheduleSchoolDays = require('../models/scheduleSchoolDays.model');
const TeachingBlocks = require('../models/teachingBlocks.model');
const SchoolDays = require('../models/schoolDays.model');
const Schedules = require('../models/schedules.model');
const sequelize = require('../config/db.config');
const {Op} = require('sequelize');
const Users = require('../models/users.model');
const Years = require('../models/years.model');

// POST automático de ScheduleSchoolDays
exports.generateScheduleDays = async (req, res) => {
    const {yearId, scheduleId} = req.body;

    if (!yearId || !scheduleId) {
        return res.status(400).json({message: "Debe proporcionar yearId y scheduleId"});
    }

    const t = await sequelize.transaction();

    try {
        // 1️⃣ Obtener el horario
        const schedule = await Schedules.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({message: "Horario no encontrado"});
        }

        // Se asume que tu modelo de horarios tiene un campo "weekday" (por ejemplo: 'lunes', 'martes', etc.)
        const weekday = schedule.weekday?.toLowerCase();
        if (!weekday) {
            return res.status(400).json({message: "El horario no tiene asignado un día de la semana"});
        }

        // 2️⃣ Buscar todos los días lectivos de ese año que coincidan con el weekday
        const schoolDays = await SchoolDays.findAll({
            where: {
                yearId,
                weekday,
                status: 1
            },
            order: [['teachingDay', 'ASC']]
        });

        if (!schoolDays.length) {
            return res.status(404).json({message: `No se encontraron días escolares para el día ${weekday} en el año ${yearId}`});
        }

        // 3️⃣ Obtener todos los bloques lectivos del año
        const teachingBlocks = await TeachingBlocks.findAll({
            where: {yearId, status: 1},
            order: [['startDay', 'ASC']]
        });

        if (!teachingBlocks.length) {
            return res.status(404).json({message: "No hay bloques lectivos definidos para este año"});
        }

        // 4️⃣ Crear registros para cada schoolDay, asignando el teachingBlock correspondiente
        const records = [];

        for (const day of schoolDays) {
            const block = teachingBlocks.find(b =>
                new Date(day.teachingDay) >= new Date(b.startDay) &&
                new Date(day.teachingDay) <= new Date(b.endDay)
            );

            if (block) {
                records.push({
                    yearId,
                    scheduleId,
                    teachingBlockId: block.id,
                    schoolDayId: day.id,
                    estado: true
                });
            }
        }

        // 5️⃣ Insertar registros en batch
        if (records.length > 0) {
            await ScheduleSchoolDays.bulkCreate(records, {transaction: t});
        }

        await t.commit();

        res.status(201).json({
            message: `Se generaron ${records.length} días lectivos para el horario ${scheduleId}`,
            registros: records
        });

    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({message: "Error generando días lectivos", error: error.message});
    }
};

// GET: listar los días asociados a un horario y año
exports.getScheduleDays = async (req, res) => {
    const {yearId, scheduleId} = req.query;

    try {
        const data = await ScheduleSchoolDays.findAll({
            where: {
                ...(yearId && {yearId}),
                ...(scheduleId && {scheduleId})
            },
            include: [
                {model: SchoolDays, as: 'schoolDays', attributes: ['teachingDay', 'weekday']},
                {model: TeachingBlocks, as: 'teachingBlocks', attributes: ['teachingBlock']}
            ],
            order: [['id', 'ASC']]
        });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({message: "Error al obtener los días de horario", error: error.message});
    }
};

exports.generateTeacherScheduleDays = async (req, res) => {
    const {yearId, teacherId} = req.body;

    if (!yearId || !teacherId) {
        return res.status(400).json({message: "Debe proporcionar yearId y teacherId"});
    }

    const t = await sequelize.transaction();

    try {
        // 1️⃣ Verificar que el docente exista
        const teacher = await Users.findByPk(teacherId);
        if (!teacher) {
            return res.status(404).json({message: "Docente no encontrado"});
        }

        // 2️⃣ Obtener todos los horarios del docente en ese año
        const schedules = await Schedules.findAll({
            where: {teacherId, yearId},
            attributes: ['id', 'weekday'],
            order: [['id', 'ASC']]
        });

        if (!schedules.length) {
            return res.status(404).json({message: "El docente no tiene horarios asignados en este año"});
        }

        // 3️⃣ Obtener todos los bloques lectivos del año
        const teachingBlocks = await TeachingBlocks.findAll({
            where: {yearId, status: 1},
            order: [['startDay', 'ASC']]
        });

        if (!teachingBlocks.length) {
            return res.status(404).json({message: "No hay bloques lectivos definidos para este año"});
        }

        let totalRecords = 0;
        const allRecords = [];

        // 4️⃣ Procesar cada horario
        for (const schedule of schedules) {
            const weekday = schedule.weekday?.toLowerCase();
            if (!weekday) continue;

            // Buscar los días lectivos del año que coincidan con el día del horario
            const schoolDays = await SchoolDays.findAll({
                where: {yearId, weekday, status: 1},
                order: [['teachingDay', 'ASC']]
            });

            // Crear registros ScheduleSchoolDays
            for (const day of schoolDays) {
                const block = teachingBlocks.find(b =>
                    new Date(day.teachingDay) >= new Date(b.startDay) &&
                    new Date(day.teachingDay) <= new Date(b.endDay)
                );

                if (block) {
                    allRecords.push({
                        yearId,
                        scheduleId: schedule.id,
                        teachingBlockId: block.id,
                        schoolDayId: day.id,
                        estado: true
                    });
                    totalRecords++;
                }
            }
        }

        // 5️⃣ Insertar todos los registros generados
        if (allRecords.length > 0) {
            await ScheduleSchoolDays.bulkCreate(allRecords, {transaction: t});
        }

        await t.commit();

        res.status(201).json({
            message: `✅ Se generaron ${totalRecords} días lectivos para el docente ${teacherId} en el año ${yearId}`,
            totalHorarios: schedules.length,
            registros: allRecords
        });

    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({
            message: "Error al generar días lectivos para el docente",
            error: error.message
        });
    }
};

exports.getDaysBySchedule = async (req, res) => {
    const {scheduleId} = req.params;

    try {
        const days = await ScheduleSchoolDays.findAll({
            where: {scheduleId},
            include: [
                {
                    model: SchoolDays,
                    as: 'schoolDays',
                    attributes: ['id', 'teachingDay', 'weekday']
                },
                {
                    model: TeachingBlocks,
                    as: 'teachingBlocks',
                    attributes: ['id', 'teachingBlock']
                }
            ],
            order: [[{model: SchoolDays, as: 'schoolDays'}, 'teachingDay', 'ASC']]
        });

        if (!days.length) {
            return res.status(404).json({message: "No se encontraron días asociados a este horario."});
        }

        res.status(200).json(days);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Error al obtener los días del horario", error: error.message});
    }
};

