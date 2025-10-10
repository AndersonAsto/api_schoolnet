const sequelize = require('../config/db.config');
const Qualifications = require('../models/qualifications.model');
const StudentEnrollments = require('../models/studentsEnrollments.model');
const Schedules = require('../models/schedules.model');
const TeachingDays = require('../models/teachingDays.model');
const Persons = require('../models/persons.model');
const Years = require('../models/years.model');
const Assistances = require('../models/assistances.model');

// Crear calificaciones en bulk
exports.createBulk = async (req, res) => {
    try {
        const qualifications = req.body; // Array de calificaciones
        if (!Array.isArray(qualifications) || qualifications.length === 0) {
            return res.status(400).json({ message: 'No se enviaron calificaciones.' });
        }

        // Si algún rating es null o vacío, se convierte en 0
        qualifications.forEach(q => {
            if (q.rating === null || q.rating === '' || q.rating === undefined) {
                q.rating = 0;
            }
        });

        await Qualifications.bulkCreate(qualifications);
        res.status(201).json({ message: 'Calificaciones registradas correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al guardar calificaciones.', error });
    }
};

// Obtener calificaciones completas con info de estudiante y horario
exports.getQualifications = async (req, res) => {
    try {
        const qualifications = await Qualifications.findAll({
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

        res.json(qualifications);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: 'Error obteniendo calificaciones'
        });
    }
};

// Actualizar calificaciones existentes en bulk
exports.bulkUpdateQualifications = async (req, res) => {
    try {
        const updates = req.body; // [{id, rating, ratingDetail, scheduleId, schoolDayId, studentId}, ...]

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ status: false, message: "No hay datos para actualizar" });
        }

        const transaction = await sequelize.transaction();

        try {
            for (const record of updates) {
                if (!record.id) {
                    throw new Error(`El registro no tiene ID: ${JSON.stringify(record)}`);
                }

                // Si rating es null o vacío, convertir a 0
                if (record.rating === null || record.rating === '' || record.rating === undefined) {
                    record.rating = 0;
                }

                await Qualifications.update(
                    {
                        rating: record.rating,
                        ratingDetail: record.ratingDetail || "",
                        scheduleId: record.scheduleId,
                        schoolDayId: record.schoolDayId,
                        studentId: record.studentId,
                    },
                    {
                        where: { id: record.id },
                        transaction
                    }
                );
            }

            await transaction.commit();
            res.json({ status: true, message: "Calificaciones actualizadas correctamente" });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Error actualizando calificaciones",
            error: error.message
        });
    }
};

// Obtener calificaciones por horario y día
exports.getByScheduleAndDay = async (req, res) => {
    try {
        const { scheduleId, schoolDayId } = req.query;

        if (!scheduleId || !schoolDayId) {
            return res.status(400).json({
                status: false,
                message: "Faltan parámetros: scheduleId y schoolDayId son requeridos"
            });
        }

        const qualifications = await Qualifications.findAll({
            where: { scheduleId, schoolDayId },
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

        res.json(qualifications);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Error obteniendo calificaciones"
        });
    }
};

exports.getByStudentAndSchedule = async (req, res) => {
  const { studentId, scheduleId } = req.params;
  try {
    const qualifications = await Qualifications.findAll({
      where: { studentId, scheduleId },
      include: [
        {
          model: TeachingDays,
          as: 'schooldays',
          attributes: ['id', 'teachingDay'],
        }
      ],
      order: [['schoolDayId', 'ASC']],
    });
    res.status(200).json(qualifications);
  } catch (error) {
    console.error('❌ Error al obtener calificaciones por estudiante y horario:', error);
    res.status(500).json({ message: 'Error obteniendo calificaciones' });
  }
};
