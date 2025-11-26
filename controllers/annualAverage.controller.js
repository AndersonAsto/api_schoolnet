const AnnualAverage = require('../models/annualAverage.model');
const OverallCourseAverage = require('../models/overallCourseAverage.model');
const TeacherGroups = require('../models/teacherGroups.model');
const StudentsEnrollments = require('../models/studentEnrollments.model');
const Years = require('../models/years.model');
const Courses = require('../models/courses.model');
const Grades = require('../models/grades.model');
const Sections = require('../models/sections.model');
const Persons = require('../models/persons.model');
const { Op } = require('sequelize');
const Tutors = require('../models/tutors.model');

exports.calculateAnnualAverage = async (req, res) => {
    try {
        const {studentId, yearId} = req.body;

        if (!studentId || !yearId) {
            return res.status(400).json({
                status: false,
                message: "Faltan parámetros requeridos: studentId o yearId."
            });
        }

        // Obtener todos los promedios por curso del estudiante en ese año
        const courseAverages = await OverallCourseAverage.findAll({
            where: {studentId, yearId},
            include: [
                {
                    model: TeacherGroups,
                    as: 'teachergroups',
                    attributes: ['courseId'],
                    include: [
                        {model: Courses, as: 'courses', attributes: ['course']}
                    ]
                }
            ]
        });

        if (!courseAverages.length) {
            return res.status(404).json({
                status: false,
                message: "No se encontraron promedios generales para el estudiante en el año indicado."
            });
        }

        // Validar que existan 10 cursos distintos
        const uniqueCourses = new Set(courseAverages.map(avg => avg.teachergroups?.courseId));
        if (uniqueCourses.size < 10) {
            return res.status(400).json({
                status: false,
                message: `El estudiante tiene solo ${uniqueCourses.size} cursos registrados. Debe tener 10 para calcular el promedio anual.`
            });
        }

        // Calcular el promedio general del año (suma de courseAverage / cantidad de cursos)
        const validAverages = courseAverages
            .map(a => parseFloat(a.courseAverage))
            .filter(v => !isNaN(v));

        const totalAverage = validAverages.reduce((acc, val) => acc + val, 0) / validAverages.length;
        const finalAverage = totalAverage.toFixed(2);

        // Verificar si ya existe un registro anual
        const existing = await AnnualAverage.findOne({
            where: {studentId, yearId}
        });

        if (existing) {
            existing.average = finalAverage;
            await existing.save();

            return res.status(200).json({
                status: true,
                message: "Promedio anual actualizado correctamente.",
                data: existing
            });
        }

        // Crear nuevo registro
        const newRecord = await AnnualAverage.create({
            studentId,
            yearId,
            average: finalAverage
        });

        res.status(201).json({
            status: true,
            message: "Promedio anual calculado y guardado correctamente.",
            data: newRecord
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.getAnnualAverageByYearAndTutor = async (req, res) => {
  try {
    const { yearId, tutorId } = req.params;

    if (!yearId) {
      return res
        .status(400)
        .json({ message: "El identificador del año es requerido." });
    }

    if (!tutorId) {
      return res
        .status(400)
        .json({ message: "El identificador del tutor es requerido." });
    }

    // 1. Buscar el grupo de tutor
    const group = await Tutors.findByPk(tutorId);

    if (!group) {
      return res
        .status(404)
        .json({ message: "Grupo de tutor no encontrado." });
    }

    // 2. Buscar todas las matrículas (StudentsEnrollments) de ese año, grado y sección
    const enrollments = await StudentsEnrollments.findAll({
      where: {
        yearId: yearId,
        gradeId: group.gradeId,
        sectionId: group.sectionId,
        status: true,
      },
      include: [
        {
          model: Persons,
          as: 'persons',
          attributes: ['names', 'lastNames']
        },
        {
          model: Grades,
          as: 'grades',
          attributes: ['grade']
        },
        {
          model: Sections,
          as: 'sections',
          attributes: ['seccion']
        },
        {
          model: Years,
          as: 'years',
          attributes: ['year']
        }
      ]
    });

    if (!enrollments.length) {
      return res.status(200).json({
        status: true,
        message: 'No hay estudiantes matriculados para este año y grupo.',
        data: []
      });
    }

    const enrollmentIds = enrollments.map(e => e.id);

    // 3. Buscar los AnnualAverage para esos students (studentId = enrollment.id)
    const annualAverages = await AnnualAverage.findAll({
      where: {
        yearId: yearId,
        studentId: {
          [Op.in]: enrollmentIds
        },
        status: true
      },
      include: [
        {
          model: StudentsEnrollments,
          as: 'students',
          include: [
            {
              model: Persons,
              as: 'persons',
              attributes: ['names', 'lastNames']
            },
            {
              model: Grades,
              as: 'grades',
              attributes: ['grade']
            },
            {
              model: Sections,
              as: 'sections',
              attributes: ['seccion']
            },
            {
              model: Years,
              as: 'years',
              attributes: ['year']
            }
          ]
        },
        {
          model: Years,
          as: 'years',
          attributes: ['year']
        }
      ],
      order: [
        [
          { model: StudentsEnrollments, as: 'students' },
          { model: Persons, as: 'persons' },
          'lastNames',
          'ASC'
        ]
      ]
    });

    return res.status(200).json({
      status: true,
      message: 'Promedios anuales por año y grupo encontrados.',
      data: annualAverages
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
  }
};

exports.getAnnualAverageByYearAndStudent = async (req, res) => {
  try {
    const { yearId, studentId } = req.params;

    if (!yearId || !studentId) {
      return res.status(400).json({
        status: false,
        message: 'El año y el estudiante son requeridos.'
      });
    }

    const annualAverage = await AnnualAverage.findOne({
      where: {
        yearId,
        studentId,
        status: true
      },
      include: [
        {
          model: StudentsEnrollments,
          as: 'students',
          include: [
            {
              model: Persons,
              as: 'persons',
              attributes: ['names', 'lastNames']
            },
            {
              model: Grades,
              as: 'grades',
              attributes: ['grade']
            },
            {
              model: Sections,
              as: 'sections',
              attributes: ['seccion']
            },
            {
              model: Years,
              as: 'years',
              attributes: ['year']
            }
          ]
        },
        {
          model: Years,
          as: 'years',
          attributes: ['year']
        }
      ],
      order: [
        [
          { model: StudentsEnrollments, as: 'students' },
          { model: Persons, as: 'persons' },
          'lastNames',
          'ASC'
        ]
      ]
    });

    if (!annualAverage) {
      return res.status(404).json({
        status: false,
        message: 'No se encontró promedio anual para este estudiante en ese año.'
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Promedio anual encontrado.',
      data: annualAverage
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
  }
};

exports.getAnnualAverageByYearAndStudents = async (req, res) => {
  try {
    const { yearId, studentIds } = req.body;

    if (!yearId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'El año y la lista de estudiantes son requeridos.',
      });
    }

    const annualAverages = await AnnualAverage.findAll({
      where: {
        yearId,
        studentId: studentIds, // IN (...)
        status: true,
      },
      include: [
        {
          model: StudentsEnrollments,
          as: 'students',
          include: [
            {
              model: Persons,
              as: 'persons',
              attributes: ['names', 'lastNames'],
            },
            {
              model: Grades,
              as: 'grades',
              attributes: ['grade'],
            },
            {
              model: Sections,
              as: 'sections',
              attributes: ['seccion'],
            },
            {
              model: Years,
              as: 'years',
              attributes: ['year'],
            },
          ],
        },
        {
          model: Years,
          as: 'years',
          attributes: ['year'],
        },
      ],
      order: [
        [
          { model: StudentsEnrollments, as: 'students' },
          { model: Persons, as: 'persons' },
          'lastNames',
          'ASC',
        ],
      ],
    });

    if (!annualAverages || annualAverages.length === 0) {
      return res.status(404).json({
        status: false,
        message:
          'No se encontraron promedios anuales para los estudiantes en ese año.',
        data: [],
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Promedios anuales encontrados.',
      data: annualAverages,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
  }
};
