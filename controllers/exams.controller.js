const Exams = require('../models/exams.model');
const StudentsEnrollments = require('../models/studentsEnrollments.model');
const TeachingBlocks = require('../models/teachingBlocks.model');
const TeacherGroups = require('../models/teacherGroups.model');
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
          model: TeacherGroups,
          as: 'assignments',
          attributes: ['id', 'courseId', 'sectionId', 'gradeId', 'teacherAssignmentId']
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
    console.error('Error al obtener exámenes: ', error);
    res.status(500).json({ message: 'Error al obtener los exámenes: ', error });
  }
};

exports.createExam = async (req, res) => {
  try {
    const { studentId, assigmentId, teachingBlockId, score, type } = req.body;

    if (!studentId || !assigmentId || !teachingBlockId || score === undefined || !type) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const studentExists = await StudentsEnrollments.findByPk(studentId);
    const assignmentExists = await TeacherGroups.findByPk(assigmentId);
    const blockExists = await TeachingBlocks.findByPk(teachingBlockId);

    if (!studentExists || !assignmentExists || !blockExists) {
      return res.status(404).json({
        message: 'Alguna de las referencias no existe (studentId, assigmentId o teachingBlockId).'
      });
    }

    const exam = await Exams.create({
      studentId,
      assigmentId,
      teachingBlockId,
      score,
      type,
      status: true,
    });

    res.status(201).json({
      message: 'Examen registrado correctamente.',
      exam,
    });

  } catch (error) {
    console.error('Error al crear el examen: ', error);
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
          model: TeacherGroups,
          as: 'assignments',
          attributes: ['id', 'courseId', 'sectionId', 'gradeId', 'teacherAssignmentId']
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

exports.getExamsByStudentAndGroup = async (req, res) => {
  try {
    const { studentId, assigmentId } = req.params;

    // Validación de parámetros obligatorios
    if (!studentId) {
      return res.status(400).json({ message: 'El parámetro studentId es obligatorio.' });
    }

    // Construimos la cláusula where dinámica
    const whereClause = { studentId };

    if (assigmentId) {
      whereClause.assigmentId = assigmentId; // usamos el nombre real de la FK en tu modelo
    }

    // 🔍 Consulta principal con includes
    const exams = await Exams.findAll({
      where: whereClause,
      include: [
        {
          model: StudentsEnrollments,
          as: 'students',
          include: [
            {
              model: Persons,
              as: 'persons',
              attributes: ['id', 'names', 'lastNames'],
            },
          ],
        },
        {
          model: TeacherGroups,
          as: 'assignments',
          attributes: ['id', 'courseId', 'sectionId', 'gradeId', 'teacherAssignmentId'],
        },
        {
          model: TeachingBlocks,
          as: 'teachingblocks',
          attributes: ['id', 'teachingBlock', 'startDay', 'endDay'],
        },
      ],
      order: [['teachingBlockId', 'ASC']],
    });

    // Si no se encontraron exámenes
    if (!exams || exams.length === 0) {
      return res.status(200).json({
        message: assigmentId
          ? 'El alumno no tiene exámenes registrados en este grupo docente.'
          : 'El alumno no tiene exámenes registrados.',
        exams: [],
      });
    }
    res.status(200).json({
      message: 'Exámenes obtenidos correctamente.',
      exams,
    });
  } catch (error) {
    console.error('❌ Error al obtener exámenes por alumno y grupo docente:', error);
    res.status(500).json({
      message: 'Error al obtener los exámenes por alumno y grupo docente.',
      error: error.message,
    });
  }
};

