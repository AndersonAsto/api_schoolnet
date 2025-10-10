const Exams = require('../models/exams.model');
const StudentsEnrollments = require('../models/studentsEnrollments.model');
const TeachingBlocks = require('../models/teachingBlocks.model');
const Schedules = require('../models/schedules.model');
const Persons = require('../models/persons.model');

exports.getAllExams = async (req, res) => {
  try {
    const exams = await Exams.findAll({
      include: [
        {
          model: StudentsEnrollments,
          as: 'students',
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
          attributes: ['id', 'courseId', 'sectionId', 'gradeId', 'teacherId', 'weekday']
        },
        {
          model: TeachingBlocks,
          as: 'teachingblocks',
          attributes: ['id', 'teachingBlock', 'startDay', 'endDay']
        }
      ],
      order: [
        ['teachingBlockId', 'ASC'],
        ['studentId', 'ASC']
      ]
    });

    res.status(200).json(exams);
  } catch (error) {
    console.error('❌ Error al obtener los exámenes:', error);
    res.status(500).json({ message: 'Error al obtener los exámenes', error });
  }
};

exports.createExam = async (req, res) => {
  try {
    const { studentId, scheduleId, teachingBlockId, score, maxScore, type } = req.body;

    // Validación simple
    if (!studentId || !scheduleId || !teachingBlockId || !score || !maxScore || !type) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios.',
      });
    }

    // Verificar que las FK existan antes de insertar
    const studentExists = await StudentsEnrollments.findByPk(studentId);
    const scheduleExists = await Schedules.findByPk(scheduleId);
    const blockExists = await TeachingBlocks.findByPk(teachingBlockId);

    if (!studentExists || !scheduleExists || !blockExists) {
      return res.status(404).json({
        message: 'Alguna de las referencias no existe (studentId, scheduleId o teachingBlockId).',
      });
    }

    // Crear registro
    const exam = await Exams.create({
      studentId,
      scheduleId,
      teachingBlockId,
      score,
      maxScore,
      type,
      status: true,
    });

    res.status(201).json({
      message: 'Examen registrado correctamente.',
      exam,
    });

  } catch (error) {
    console.error('❌ Error al crear el examen:', error);
    res.status(500).json({
      message: 'Error al crear el examen',
      error: error.message,
    });
  }
};

exports.getExamsByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: 'Se requiere el studentId en los parámetros.' });
    }

    const exams = await Exams.findAll({
      where: { studentId },
      include: [
        {
          model: StudentsEnrollments,
          as: 'students',
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
          attributes: ['id', 'courseId', 'sectionId', 'gradeId', 'teacherId', 'weekday']
        },
        {
          model: TeachingBlocks,
          as: 'teachingblocks',
          attributes: ['id', 'teachingBlock', 'startDay', 'endDay']
        }
      ],
      order: [['teachingBlockId', 'ASC']]
    });

    if (!exams || exams.length === 0) {
      return res.status(200).json({ message: 'El alumno no tiene registros de exámenes.', exams: [] });
    }

    res.status(200).json(exams);
  } catch (error) {
    console.error('❌ Error al obtener exámenes por alumno:', error);
    res.status(500).json({ message: 'Error al obtener exámenes por alumno', error });
  }
};
