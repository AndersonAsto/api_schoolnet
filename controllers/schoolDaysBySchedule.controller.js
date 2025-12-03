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

async function findTeacherOrThrow(teacherId) {
    const teacher = await db.Users.findByPk(teacherId);
    if (!teacher) {
        const error = new Error("DOCENTE_NO_ENCONTRADO");
        throw error;
    }
    return teacher;
}

async function findSchedulesByTeacherAndYearOrThrow(teacherId, yearId) {
    const schedules = await db.Schedules.findAll({
        where: { teacherId, yearId },
        attributes: ['id', 'weekday'],
        order: [['id', 'ASC']]
    });

    if (!schedules.length) {
        const error = new Error("DOCENTE_SIN_HORARIOS");
        throw error;
    }

    return schedules;
}

async function findTeachingBlocksByYearOrThrow(yearId) {
    const teachingBlocks = await db.TeachingBlocks.findAll({
        where: { yearId, status: 1 },
        order: [['startDay', 'ASC']]
    });

    if (!teachingBlocks.length) {
        const error = new Error("SIN_BLOQUES_LECTIVOS");
        throw error;
    }

    return teachingBlocks;
}

async function buildScheduleSchoolDayRecords({ yearId, schedules, teachingBlocks }) {
    let totalRecords = 0;
    const allRecords = [];

    for (const schedule of schedules) {
        const weekday = schedule.weekday?.toLowerCase();
        if (!weekday) continue;

        const schoolDays = await db.SchoolDays.findAll({
            where: { yearId, weekday, status: 1 },
            order: [['teachingDay', 'ASC']]
        });

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

    return { totalRecords, allRecords };
}

// === Controlador ===
exports.bulkCreateSchoolDaysByYearAndTeacher = async (req, res) => {
    const { yearId, teacherId } = req.body;

    if (!yearId || !teacherId) {
        return res.status(400).json({ message: "Debe proporcionar yearId y teacherId" });
    }

    const t = await db.sequelize.transaction();

    try {
        // 1. Validaciones base
        await findTeacherOrThrow(teacherId);
        const schedules = await findSchedulesByTeacherAndYearOrThrow(teacherId, yearId);
        const teachingBlocks = await findTeachingBlocksByYearOrThrow(yearId);

        // 2. Generar TODOS los registros posibles
        const { totalRecords, allRecords } = await buildScheduleSchoolDayRecords({
            yearId,
            schedules,
            teachingBlocks
        });

        // 3. Ver qué combinaciones ya existen para evitar duplicados
        //    Tomamos los scheduleIds y schoolDayIds únicos a partir de allRecords
        const scheduleIds = [...new Set(allRecords.map(r => r.scheduleId))];
        const schoolDayIds = [...new Set(allRecords.map(r => r.schoolDayId))];

        const existentes = await db.SchoolDaysBySchedule.findAll({
            where: {
                yearId,
                scheduleId: scheduleIds,
                schoolDayId: schoolDayIds
            },
            attributes: ['yearId', 'scheduleId', 'schoolDayId']
        });

        const existentesSet = new Set(
            existentes.map(e => `${e.yearId}-${e.scheduleId}-${e.schoolDayId}`)
        );

        const nuevosRecords = allRecords.filter(r => {
            const key = `${r.yearId}-${r.scheduleId}-${r.schoolDayId}`;
            return !existentesSet.has(key);
        });

        const cantidadDuplicados = allRecords.length - nuevosRecords.length;

        // 4. Insertar solo los nuevos registros
        if (nuevosRecords.length > 0) {
            await db.SchoolDaysBySchedule.bulkCreate(nuevosRecords, { transaction: t });
        }

        await t.commit();

        return res.status(201).json({
            message: `Se generaron ${nuevosRecords.length} días lectivos nuevos para el docente ${teacherId} en el año ${yearId}`,
            totalPosibles: totalRecords,
            totalInsertados: nuevosRecords.length,
            totalDuplicadosIgnorados: cantidadDuplicados,
            totalHorarios: schedules.length,
            registrosInsertados: nuevosRecords
        });

    } catch (error) {
        await t.rollback();

        if (error.message === "DOCENTE_NO_ENCONTRADO") {
            return res.status(404).json({ message: "Docente no encontrado" });
        }
        if (error.message === "DOCENTE_SIN_HORARIOS") {
            return res.status(404).json({ message: "El docente no tiene horarios asignados en este año" });
        }
        if (error.message === "SIN_BLOQUES_LECTIVOS") {
            return res.status(404).json({ message: "No hay bloques lectivos definidos para este año" });
        }

        console.error(error.message);
        return res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
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
