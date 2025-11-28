const {Op} = require('sequelize');
const db = require('../models');

exports.bulkCreateQualifications = async (req, res) => {
    try {
        const qualifications = req.body; // Array de calificaciones
        if (!Array.isArray(qualifications) || qualifications.length === 0) {
            return res.status(400).json({message: 'No se enviaron calificaciones.'});
        }

        // Si algún rating es null o vacío, se convierte en 0
        qualifications.forEach(q => {
            if (q.rating === null || q.rating === '' || q.rating === undefined) {
                q.rating = 0;
            }
        });

        await db.Qualifications.bulkCreate(qualifications);
        res.status(201).json({message: 'Calificaciones registradas correctamente.'});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getQualifications = async (req, res) => {
    try {
        const qualifications = await db.Qualifications.findAll({
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

        res.json(qualifications);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.bulkUpdateQualifications = async (req, res) => {
    try {
        const updates = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({status: false, message: "No hay datos para actualizar"});
        }

        const transaction = await db.sequelize.transaction();

        try {
            for (const record of updates) {
                if (!record.id) {
                    throw new Error(`El registro no tiene ID: ${JSON.stringify(record)}`);
                }

                // Si rating es null o vacío, convertir a 0
                if (record.rating === null || record.rating === '' || record.rating === undefined) {
                    record.rating = 0;
                }

                await db.Qualifications.update(
                    {
                        rating: record.rating,
                        ratingDetail: record.ratingDetail || "",
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
            res.json({status: true, message: "Calificaciones actualizadas correctamente"});

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getQualificationsByScheduleAndDay = async (req, res) => {
    try {
        const {scheduleId, schoolDayId} = req.query;

        if (!scheduleId || !schoolDayId) {
            return res.status(400).json({
                status: false,
                message: "Faltan parámetros: scheduleId y schoolDayId son requeridos"
            });
        }

        const qualifications = await db.Qualifications.findAll({
            where: {scheduleId, schoolDayId},
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
        res.json(qualifications);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getQualificationsByScheduleAndStudent = async (req, res) => {
    const {studentId, scheduleId} = req.params;
    try {
        const qualifications = await db.Qualifications.findAll({
            where: {studentId, scheduleId},
            include: [
                {
                    model: db.SchoolDays,
                    as: 'schooldays',
                    attributes: ['id', 'teachingDay'],
                }
            ],
            order: [['schoolDayId', 'ASC']],
        });
        res.status(200).json(qualifications);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getQualificationsByGroupAndStudent = async (req, res) => {
    try {
        const {teacherGroupId, studentId} = req.params;

        // Buscar el grupo de docente
        const teacherGroup = await db.TeacherGroups.findByPk(teacherGroupId);
        if (!teacherGroup) {
            return res.status(404).json({message: 'Grupo de docente no encontrado'});
        }

        // Buscar los horarios (Schedules) que coincidan con curso, grado, sección y año
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

        // Buscar las calificaciones del estudiante en esos horarios
        const qualifications = await db.Qualifications.findAll({
            where: {
                studentId: studentId,
                scheduleId: {[Op.in]: scheduleIds},
                status: true
            },
            include: [
                {
                    model: db.SchoolDays,
                    as: 'schooldays',
                    attributes: ['id', 'teachingDay']
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        return res.json(qualifications);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};
