const db = require('../models');

exports.bulkCreateSchoolDaysByYearAndSchedule = async (req, res) => {
    const {yearId, scheduleId} = req.body;

    if (!yearId || !scheduleId) {
        return res.status(400).json({message: "Debe proporcionar yearId y scheduleId"});
    }

    const t = await db.sequelize.transaction();

    try {
        // Obtener el horario
        const schedule = await db.Schedules.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({message: "Horario no encontrado"});
        }

        // Se asume que tu modelo de horarios tiene un campo "weekday" (por ejemplo: 'lunes', 'martes', etc.)
        const weekday = schedule.weekday?.toLowerCase();
        if (!weekday) {
            return res.status(400).json({message: "El horario no tiene asignado un día de la semana"});
        }

        // Buscar todos los días lectivos de ese año que coincidan con el weekday
        const schoolDays = await db.SchoolDays.findAll({
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

        // Obtener todos los bloques lectivos del año
        const teachingBlocks = await db.TeachingBlocks.findAll({
            where: {yearId, status: 1},
            order: [['startDay', 'ASC']]
        });

        if (!teachingBlocks.length) {
            return res.status(404).json({message: "No hay bloques lectivos definidos para este año"});
        }

        // Crear registros para cada schoolDay, asignando el teachingBlock correspondiente
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

        // Insertar registros en batch
        if (records.length > 0) {
            await db.SchoolDaysBySchedule.bulkCreate(records, {transaction: t});
        }

        await t.commit();

        res.status(201).json({
            message: `Se generaron ${records.length} días lectivos para el horario ${scheduleId}`,
            registros: records
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getSchoolDaysBySchedule = async (req, res) => {
    const {yearId, scheduleId} = req.query;

    try {
        const data = await db.SchoolDaysBySchedule.findAll({
            where: {
                ...(yearId && {yearId}),
                ...(scheduleId && {scheduleId})
            },
            include: [
                {model: db.SchoolDays, as: 'schoolDays', attributes: ['id', 'teachingDay', 'weekday']},
                {model: db.Years, as: 'years', attributes: ['id', 'year']},
                {model: db.Schedules, as: 'schedules'},
                {model: db.TeachingBlocks, as: 'teachingBlocks', attributes: ['id', 'teachingBlock']}
            ],
            order: [['id', 'ASC']]
        });

        res.status(200).json(data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.bulkCreateSchoolDaysByYearAndTeacher = async (req, res) => {
    const {yearId, teacherId} = req.body;

    if (!yearId || !teacherId) {
        return res.status(400).json({message: "Debe proporcionar yearId y teacherId"});
    }

    const t = await db.sequelize.transaction();

    try {
        // Verificar que el docente exista
        const teacher = await db.Users.findByPk(teacherId);
        if (!teacher) {
            return res.status(404).json({message: "Docente no encontrado"});
        }

        // Obtener todos los horarios del docente en ese año
        const schedules = await db.Schedules.findAll({
            where: {teacherId, yearId},
            attributes: ['id', 'weekday'],
            order: [['id', 'ASC']]
        });

        if (!schedules.length) {
            return res.status(404).json({message: "El docente no tiene horarios asignados en este año"});
        }

        // Obtener todos los bloques lectivos del año
        const teachingBlocks = await db.TeachingBlocks.findAll({
            where: {yearId, status: 1},
            order: [['startDay', 'ASC']]
        });

        if (!teachingBlocks.length) {
            return res.status(404).json({message: "No hay bloques lectivos definidos para este año"});
        }

        let totalRecords = 0;
        const allRecords = [];

        // Procesar cada horario
        for (const schedule of schedules) {
            const weekday = schedule.weekday?.toLowerCase();
            if (!weekday) continue;

            // Buscar los días lectivos del año que coincidan con el día del horario
            const schoolDays = await db.SchoolDays.findAll({
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

        // Insertar todos los registros generados
        if (allRecords.length > 0) {
            await db.SchoolDaysBySchedule.bulkCreate(allRecords, {transaction: t});
        }

        await t.commit();

        res.status(201).json({
            message: `Se generaron ${totalRecords} días lectivos para el docente ${teacherId} en el año ${yearId}`,
            totalHorarios: schedules.length,
            registros: allRecords
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getDaysBySchedule = async (req, res) => {
    const {scheduleId} = req.params;

    try {
        const days = await db.SchoolDaysBySchedule.findAll({
            where: {scheduleId},
            include: [
                {model: db.SchoolDays, as: 'schoolDays', attributes: ['id', 'teachingDay', 'weekday']},
                {model: db.Years, as: 'years', attributes: ['id', 'year']},
                {model: db.Schedules, as: 'schedules'},
                {model: db.TeachingBlocks, as: 'teachingBlocks', attributes: ['id', 'teachingBlock']}
            ],
            order: [[{model: db.SchoolDays, as: 'schoolDays'}, 'teachingDay', 'ASC']]
        });

        if (!days.length) {
            return res.status(404).json({message: "No se encontraron días asociados a este horario."});
        }

        res.status(200).json(days);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};
