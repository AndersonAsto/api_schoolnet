const db = require('../models');

exports.createIncident = async (req, res) => {
    try {
        const {studentId, scheduleId, schoolDayId, incidentDetail} = req.body;

        if (!studentId || !scheduleId || !schoolDayId) {
            return res.status(400).json({
                message: "Los campos studentId, scheduleId y schoolDayId son obligatorios."
            });
        }

        const newIncident = await db.Incidents.create({
            studentId,
            scheduleId,
            schoolDayId,
            incidentDetail
        });

        return res.status(201).json({
            message: "Incidencia registrada correctamente.",
            data: newIncident
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getIncidents = async (req, res) => {
    try {
        const incidents = await db.Incidents.findAll({
            include: [
                {
                    model: db.StudentEnrollments,
                    as: 'students',
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['names', 'lastNames', 'dni']
                        },
                        {
                            model: db.Grades,
                            as: 'grades',
                            attributes: ['grade']
                        },
                        {
                            model: db.Sections,
                            as: 'sections',
                            attributes: ['seccion']
                        }
                    ]
                },
                {
                    model: db.Schedules,
                    as: 'schedules',
                    include: [
                        {
                            model: db.Courses,
                            as: 'courses',
                            attributes: ['course']
                        }
                    ]
                },
                {
                    model: db.SchoolDays,
                    as: 'schooldays',
                    attributes: ['id', 'teachingDay']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            message: "Lista de incidencias obtenida correctamente.",
            data: incidents
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.deleteIncident = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({message: 'Identificador inválido o no proporcionado.'});
        }

        const deleted = await db.Incidents.destroy({where: {id}});

        if (deleted === 0) {
            return res.status(404).json({message: 'Incidencia no encontrada.'});
        }

        res.status(200).json({message: 'Incidencia eliminada correctamente.'});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.updateIncident = async (req, res) => {
    const {id} = req.params;
    const {studentId, scheduleId, schoolDayId, incidentDetail} = req.body;
    try {
        const incidents = await db.Incidents.findByPk(id);

        if (!incidents) {
            return res.status(404).json({message: 'Incidente no encontrado.'});
        }

        incidents.studentId = studentId;
        incidents.scheduleId = scheduleId;
        incidents.schoolDayId = schoolDayId;
        incidents.incidentDetail = incidentDetail;

        await incidents.save();
        res.status(200).json(incidents);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getIncidentsByScheduleAndStudent = async (req, res) => {
    try {
        const {studentId, scheduleId} = req.params;

        const incidents = await db.Incidents.findAll({
            where: {studentId, scheduleId},
            include: [
                {
                    model: db.StudentsEnrollments,
                    as: 'students',
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['names', 'lastNames']
                        },
                        {
                            model: db.Grades,
                            as: 'grades',
                            attributes: ['grade']
                        },
                        {
                            model: db.Sections,
                            as: 'sections',
                            attributes: ['seccion']
                        }
                    ]
                },
                {model: db.SchoolDays, as: 'schooldays', attributes: ['teachingDay']},
                {
                    model: db.Schedules,
                    as: 'schedules',
                    include: [
                        {
                            model: db.Courses,
                            as: 'courses',
                            attributes: ['course']
                        },
                        {
                            model: db.Grades,
                            as: 'grades',
                            attributes: ['grade']
                        },
                        {
                            model: db.Sections,
                            as: 'sections',
                            attributes: ['seccion']
                        }
                    ]
                },
            ],
            order: [[{model: db.SchoolDays, as: 'schooldays'}, 'teachingDay', 'ASC']]
        });

        res.json(incidents);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};
