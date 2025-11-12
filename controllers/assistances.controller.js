const sequelize = require('../config/db.config');
const Assistances = require('../models/assistances.model');
const StudentEnrollments = require('../models/studentEnrollments.model');
const Schedules = require('../models/schedules.model');
const TeachingDays = require('../models/schoolDays.model');
const Years = require('../models/years.model');
const Persons = require('../models/persons.model');
const {Op} = require('sequelize');
const TeacherGroups = require('../models/teacherGroups.model');
const StudentsEnrollments = require('../models/studentEnrollments.model');

exports.createBulk = async (req, res) => {
    try {
        const assistances = req.body; // Array de asistencias
        if (!Array.isArray(assistances) || assistances.length === 0) {
            return res.status(400).json({message: 'No se enviaron asistencias.'});
        }

        await Assistances.bulkCreate(assistances);
        res.status(201).json({message: 'Asistencias registradas correctamente.'});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al guardar asistencias.', error});
    }
};

exports.getAssistances = async (req, res) => {
    try {
        const assistances = await Assistances.findAll({
            include: [
                {
                    model: StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames', 'role']
                        }
                    ]
                },
                {
                    model: Schedules,
                    as: 'schedules',
                    attributes: ['id', 'teacherId', 'courseId', 'gradeId', 'sectionId', 'weekday', 'startTime', 'endTime'],
                    include: [
                        {
                            model: Years,
                            as: 'years',
                            attributes: ['id', 'year'],
                        }
                    ],
                },
                {
                    model: TeachingDays,
                    as: 'schooldays',
                    attributes: ['id', 'teachingDay'],
                    include: [
                        {
                            model: Years,
                            as: 'years',
                            attributes: ['id', 'year'],
                        }
                    ],
                }
            ],
            order: [['id', 'ASC']]
        });
        res.json(assistances);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: 'Error obteniendo asistencias'
        });
    }
};

exports.bulkUpdateAssistances = async (req, res) => {
    try {
        const updates = req.body; // [{id, assistance, assistanceDetail, scheduleId, schoolDayId, studentId}, ...]

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({status: false, message: "No hay datos para actualizar"});
        }

        // Usamos una transacción para seguridad
        const transaction = await sequelize.transaction();

        try {
            for (const record of updates) {
                if (!record.id) {
                    throw new Error(`El registro no tiene ID: ${JSON.stringify(record)}`);
                }

                await Assistances.update(
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
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Error actualizando asistencias",
            error: error.message
        });
    }
};

exports.getByScheduleAndDay = async (req, res) => {
    try {
        const {scheduleId, schoolDayId} = req.query;

        if (!scheduleId || !schoolDayId) {
            return res.status(400).json({
                status: false,
                message: "Faltan parámetros: scheduleId y schoolDayId son requeridos"
            });
        }

        const assistances = await Assistances.findAll({
            where: {
                scheduleId: Number(scheduleId),
                schoolDayId: Number(schoolDayId)
            },
            include: [
                {
                    model: StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: Persons,
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
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Error obteniendo asistencias"
        });
    }
};

exports.getByStudentAndSchedule = async (req, res) => {
    const {studentId, scheduleId} = req.params;

    try {
        const assistances = await Assistances.findAll({
            where: {
                studentId,
                scheduleId
            },
            include: [
                {
                    model: StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames']
                        }
                    ]
                },
                {
                    model: Schedules,
                    as: 'schedules',
                    attributes: ['id', 'courseId', 'gradeId', 'sectionId', 'teacherId', 'weekday']
                },
                {
                    model: TeachingDays,
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
        console.error("❌ Error obteniendo asistencias por estudiante:", error);
        res.status(500).json({message: "Error obteniendo asistencias", error});
    }
};

exports.getAssistancesByGroupAndStudent = async (req, res) => {
    try {
        const {teacherGroupId, studentId} = req.params;

        // 1️⃣ Buscar el grupo del docente
        const teacherGroup = await TeacherGroups.findByPk(teacherGroupId);
        if (!teacherGroup) {
            return res.status(404).json({message: 'Grupo de docente no encontrado'});
        }

        // 2️⃣ Buscar los horarios que coincidan con curso, grado, sección y año
        const schedules = await Schedules.findAll({
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

        // 3️⃣ Buscar asistencias del estudiante en esos horarios
        const assistances = await Assistances.findAll({
            where: {
                studentId: studentId,
                scheduleId: {[Op.in]: scheduleIds},
                status: true
            },
            include: [
                {
                    model: StudentsEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames']
                        }
                    ]
                },
                {
                    model: Schedules,
                    as: 'schedules',
                    attributes: ['id', 'courseId', 'gradeId', 'sectionId', 'teacherId', 'weekday']
                },
                {
                    model: TeachingDays,
                    as: 'schooldays',
                    attributes: ['id', 'teachingDay']
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        // 4️⃣ Responder
        return res.json(assistances);

    } catch (error) {
        console.error('Error al obtener asistencias:', error);
        return res.status(500).json({
            message: 'Error al obtener asistencias',
            error: error.message
        });
    }
};