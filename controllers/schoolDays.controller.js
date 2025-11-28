const db = require('../models');

function getWeekNumberMondayFirst(date) {
    const year = date.getUTCFullYear();
    const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
    const dayOfWeek = (firstDayOfYear.getUTCDay() + 6) % 7; // lunes=0
    const firstMonday = new Date(firstDayOfYear);
    firstMonday.setUTCDate(firstDayOfYear.getUTCDate() + (dayOfWeek === 0 ? 0 : 7 - dayOfWeek));

    const diffDays = Math.floor((date - firstMonday) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? Math.floor(diffDays / 7) + 1 : 0;
}

exports.bulkCreateSchoolDays = async (req, res) => {
    try {
        const {yearId, teachingDay} = req.body;

        if (!yearId || !Array.isArray(teachingDay) || teachingDay.length === 0) {
            return res.status(400).json({message: 'Datos inválidos.'});
        }

        const existing = await db.SchoolDays.findOne({where: {yearId}});
        if (existing)
            return res.status(409).json({message: 'Los días lectivos para este año ya existen.'});

        const weekdayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

        // Ordenamos fechas para encontrar la primera del ciclo lectivo
        const sortedDates = [...teachingDay].sort();
        const firstDateObj = new Date(`${sortedDates[0]}T00:00:00Z`);
        const firstWeekNumber = getWeekNumberMondayFirst(firstDateObj);

        const registrations = teachingDay.map(fecha => {
            const dateObj = new Date(`${fecha}T00:00:00Z`);
            const weekdayNumber = (dateObj.getUTCDay() + 6) % 7 + 1;
            const absoluteWeek = getWeekNumberMondayFirst(dateObj);
            const relativeWeek = absoluteWeek - firstWeekNumber + 1;

            return {
                yearId,
                teachingDay: fecha,
                weekday: weekdayNames[weekdayNumber - 1],
                weekdayNumber,
                weekNumber: relativeWeek
            };
        });

        await db.SchoolDays.bulkCreate(registrations, {ignoreDuplicates: true});
        res.status(201).json({message: 'Días lectivos registrados correctamente.'});

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getSchoolDays = async (req, res) => {
    try {
        const schoolDays = await db.SchoolDays.findAll({
            include: {
                model: db.Years,
                as: 'years',
                attributes: ['id', 'year', 'status']
            }
        });
        res.status(200).json(schoolDays);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getSchoolDaysByYear = async (req, res) => {
    try {
        const {yearId} = req.params;

        if (!yearId)
            return res.status(400).json({message: 'El identificador del año es requerido'});

        const days = await db.SchoolDays.findAll({
            where: {yearId},
            order: [
                ['teachingDay', 'ASC']
            ]
        });
        res.status(200).json(days);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};
