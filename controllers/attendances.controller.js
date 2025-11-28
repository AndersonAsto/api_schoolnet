const {Op} = require('sequelize');
const db = require('../models');

exports.bulkCreateAttendances = async (req, res) => {
    try {
        const attendances = req.body;
        if (!Array.isArray(attendances) || attendances.length === 0) {
            return res.status(400).json({message: 'No se enviaron asistencias.'});
        }

        await db.Attendances.bulkCreate(attendances);
        res.status(201).json({message: 'Asistencias registradas correctamente.'});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getAttendances = async (req, res) => {
    try {
        const attendances = await db.Attendances.findAll({
            include: [
                {
                    model: db.StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames', 'role']
                        }
                    ]
                },
                {
                    model: db.Schedules,
                    as: 'schedules',
                    attributes: ['id', 'teacherId', 'courseId', 'gradeId', 'sectionId', 'weekday', 'startTime', 'endTime'],
                    include: [
                        {
                            model: db.Years,
                            as: 'years',
                            attributes: ['id', 'year'],
                        }
                    ],
                },
                {
                    model: db.SchoolDays,
                    as: 'schooldays',
                    attributes: ['id', 'teachingDay'],
                    include: [
                        {
                            model: db.Years,
                            as: 'years',
                            attributes: ['id', 'year'],
                        }
                    ],
                }
            ],
            order: [['id', 'ASC']]
        });
        res.status(200).json(attendances);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.bulkUpdateAttendances = async (req, res) => {
    try {
        const updates = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({status: false, message: "No hay datos para actualizar."});
        }
        const transaction = await db.sequelize.transaction();
        try {
            for (const record of updates) {
                if (!record.id) {
                    throw new Error(`El registro no tiene ID: ${JSON.stringify(record)}`);
                }
                await db.Attendances.update(
                    {
                        assistance: record.assistance,
                        assistanceDetail: record.assistanceDetail || null,
                        scheduleId: record.scheduleId,
                        schoolDayId: record.schoolDayId,
                        studentId: record.studentId,
                    },
                    {
                        where: {id: record.id},
                        transaction
                    }
                );
            }

            await transaction.commit();
            res.json({status: true, message: "Asistencias actualizadas correctamente"});

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getAttendancesByScheduleAndDay = async (req, res) => {
    try {
        const {scheduleId, schoolDayId} = req.query;

        if (!scheduleId || !schoolDayId) {
            return res.status(400).json({
                status: false,
                message: "Faltan parámetros: scheduleId y schoolDayId son requeridos"
            });
        }

        const assistances = await db.Attendances.findAll({
            where: {
                scheduleId: Number(scheduleId),
                schoolDayId: Number(schoolDayId)
            },
            include: [
                {
                    model: db.StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames']
                        }
                    ]
                }
            ],
            order: [['id', 'ASC']]
        });

        res.json(assistances);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getAttendancesByScheduleAndStudent = async (req, res) => {
    const {studentId, scheduleId} = req.params;

    try {
        const assistances = await db.Attendances.findAll({
            where: {
                studentId,
                scheduleId
            },
            include: [
                {
                    model: db.StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames']
                        }
                    ]
                },
                {
                    model: db.Schedules,
                    as: 'schedules',
                    attributes: ['id', 'courseId', 'gradeId', 'sectionId', 'teacherId', 'weekday']
                },
                {
                    model: db.SchoolDays,
                    as: 'schooldays',
                    attributes: ['id', 'teachingDay']
                }
            ],
            order: [['schooldayId', 'ASC']]
        });

        if (assistances.length === 0) {
            return res.status(200).json({message: "No se encontraron asistencias para este estudiante."});
        }

        res.status(200).json(assistances);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getAttendancesByGroupAndStudent = async (req, res) => {
    try {
        const {teacherGroupId, studentId} = req.params;

        const teacherGroup = await db.TeacherGroups.findByPk(teacherGroupId);
        if (!teacherGroup) {
            return res.status(404).json({message: 'Grupo de docente no encontrado'});
        }

        const schedules = await db.Schedules.findAll({
            where: {
                courseId: teacherGroup.courseId,
                gradeId: teacherGroup.gradeId,
                sectionId: teacherGroup.sectionId,
                yearId: teacherGroup.yearId,
                status: true
            }
        });

        if (!schedules || schedules.length === 0) {
            return res.status(404).json({message: 'No se encontraron horarios para este grupo'});
        }

        const scheduleIds = schedules.map(s => s.id);

        const assistances = await db.Attendances.findAll({
            where: {
                studentId: studentId,
                scheduleId: {[Op.in]: scheduleIds},
                status: true
            },
            include: [
                {
                    model: db.StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames']
                        }
                    ]
                },
                {
                    model: db.Schedules,
                    as: 'schedules',
                    attributes: ['id', 'courseId', 'gradeId', 'sectionId', 'teacherId', 'weekday']
                },
                {
                    model: db.SchoolDays,
                    as: 'schooldays',
                    attributes: ['id', 'teachingDay']
                }
            ],
            order: [['createdAt', 'ASC']]
        });
        return res.json(assistances);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};
