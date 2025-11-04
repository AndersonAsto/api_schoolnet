const OverallCourseAverage = require('../models/generalAverage.model');
const TeachingBlockAvarage = require('../models/teachingBlockAvarage.model');
const StudentsEnrollments = require('../models/studentsEnrollments.model');
const Years = require('../models/years.model');
const TeachingBlocks = require('../models/teachingBlocks.model');
const Persons = require('../models/persons.model');
const Courses = require('../models/courses.model');
const Grades = require('../models/grades.model');
const Sections = require('../models/sections.model');
const TeacherGroups = require('../models/teacherGroups.model');

exports.calculateAnnualAverage = async (req, res) => {
  try {
    const { studentId, assignmentId, yearId } = req.body;

    if (!studentId || !assignmentId || !yearId) {
      return res.status(400).json({
        message: "Faltan parámetros: studentId, scheduleId o yearId",
      });
    }

    // 🔹 Traer los promedios por bloque lectivo existentes
    const blocks = await TeachingBlockAvarage.findAll({
      where: { studentId, assignmentId },
      include: [
        { model: TeachingBlocks, as: "teachingblocks", attributes: ["id", "teachingBlock", "startDay", "endDay", "yearId"], where: { yearId } },
      ],
      order: [["teachingBlockId", "ASC"]],
    });

    if (!blocks.length) {
      return res.status(404).json({ message: "No se encontraron promedios de bloques lectivos para este estudiante y año." });
    }

    // 🔹 Cargar los promedios por bloque según el orden
    const averages = [null, null, null, null];
    blocks.forEach((b, i) => {
      averages[i] = parseFloat(b.teachingBlockAvarage);
    });

    // 🔹 Calcular promedio anual considerando solo los bloques existentes
    const validAverages = averages.filter(v => v !== null && !isNaN(v));
    const courseAverage = validAverages.length
      ? (validAverages.reduce((a, b) => a + b, 0) / validAverages.length).toFixed(2)
      : null;

    if (courseAverage === null) {
      return res.status(400).json({ message: "No se puede calcular el promedio anual (no hay bloques válidos)." });
    }

    // 🔹 Crear o actualizar registro existente
    const [record, created] = await OverallCourseAverage.findOrCreate({
      where: { studentId, assignmentId, yearId },
      defaults: {
        block1Average: averages[0],
        block2Average: averages[1],
        block3Average: averages[2],
        block4Average: averages[3],
        courseAverage: courseAverage,
        status: true,
      },
    });

    if (!created) {
      // 🔄 Si ya existe, actualizar los valores
      record.block1Average = averages[0];
      record.block2Average = averages[1];
      record.block3Average = averages[2];
      record.block4Average = averages[3];
      record.courseAverage = courseAverage;
      await record.save();
    }

    res.status(200).json({
      message: created ? "Promedio anual registrado correctamente." : "Promedio anual actualizado.",
      courseAverage: record,
    });

  } catch (error) {
    console.error("❌ Error al calcular promedio general:", error);
    res.status(500).json({
      message: "Error al calcular promedio general anual.",
      error: error.message,
    });
  }
};

exports.getGeneralAvarageByFilters = async (req, res) => {
  try {
    const { studentId, yearId } = req.query;

    if (!studentId || !yearId ) {
      return res.status(400).json({
        status: false,
        message: "Faltan parámetros requeridos: studentId, yearId o assignmentId."
      });
    }

    const records = await OverallCourseAverage.findAll({
      where: { studentId, yearId },
      include: [
        {
          model: StudentsEnrollments,
          as: 'students',
          attributes: ['id'],
          include: [
            {
              model: Persons,
              as: 'persons',
              attributes: ['names', 'lastNames']
            }
          ]
        },
        {
          model: Years,
          as: 'years',
          attributes: ['year']
        },
        {
          model: TeacherGroups,
          as: 'teachergroups',
          attributes: ['id', 'teacherAssignmentId', 'gradeId', 'sectionId', 'courseId'],
          include: [
            {
              model: Courses,
              as: 'courses',
              attributes: ['course']
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
            }
          ]
        }
      ],
      order: [['id', 'ASC']]
    });

    if (!records.length) {
      return res.status(404).json({
        status: false,
        message: "No se encontraron promedios generales para los filtros seleccionados."
      });
    }

    res.status(200).json({
      status: true,
      message: "Promedios generales por cursos encontrados.",
      data: records
    });

  } catch (error) {
    console.error("❌ Error al obtener promedios generales:", error);
    res.status(500).json({
      status: false,
      message: "Error al obtener promedios generales.",
      error: error.message
    });
  }
};

exports.getGeneralAvarageBySYA = async (req, res) => {
  try {
    const { studentId, yearId, assignmentId } = req.query;

    if (!studentId || !yearId || !assignmentId) {
      return res.status(400).json({
        status: false,
        message: "Faltan parámetros requeridos: studentId, yearId o assignmentId."
      });
    }

    const records = await OverallCourseAverage.findAll({
      where: { studentId, yearId, assignmentId },
      include: [
        {
          model: StudentsEnrollments,
          as: 'students',
          attributes: ['id'],
          include: [
            {
              model: Persons,
              as: 'persons',
              attributes: ['names', 'lastNames']
            }
          ]
        },
        {
          model: Years,
          as: 'years',
          attributes: ['year']
        },
        {
          model: TeacherGroups,
          as: 'teachergroups',
          attributes: ['id', 'teacherAssignmentId', 'gradeId', 'sectionId', 'courseId'],
          include: [
            {
              model: Courses,
              as: 'courses',
              attributes: ['course']
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
            }
          ]
        }
      ],
      order: [['id', 'ASC']]
    });

    if (!records.length) {
      return res.status(404).json({
        status: false,
        message: "No se encontraron promedios generales para los filtros seleccionados."
      });
    }

    res.status(200).json({
      status: true,
      message: "Promedios generales por cursos encontrados.",
      data: records
    });

  } catch (error) {
    console.error("❌ Error al obtener promedios generales:", error);
    res.status(500).json({
      status: false,
      message: "Error al obtener promedios generales.",
      error: error.message
    });
  }
};

exports.getGeneralAvarageByAssignment = async (req, res) => {
  try {
    const { yearId, assignmentId } = req.query;

    if (!yearId || !assignmentId) {
      return res.status(400).json({
        status: false,
        message: "Faltan parámetros requeridos: studentId, yearId o assignmentId."
      });
    }

    const records = await OverallCourseAverage.findAll({
      where: { yearId, assignmentId },
      include: [
        {
          model: StudentsEnrollments,
          as: 'students',
          attributes: ['id'],
          include: [
            {
              model: Persons,
              as: 'persons',
              attributes: ['names', 'lastNames']
            }
          ]
        },
        {
          model: Years,
          as: 'years',
          attributes: ['year']
        },
        {
          model: TeacherGroups,
          as: 'teachergroups',
          attributes: ['id', 'teacherAssignmentId', 'gradeId', 'sectionId', 'courseId'],
          include: [
            {
              model: Courses,
              as: 'courses',
              attributes: ['course']
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
            }
          ]
        }
      ],
      order: [['id', 'ASC']]
    });

    if (!records.length) {
      return res.status(404).json({
        status: false,
        message: "No se encontraron promedios generales para los filtros seleccionados."
      });
    }

    res.status(200).json({
      status: true,
      message: "Promedios generales por cursos encontrados.",
      data: records
    });

  } catch (error) {
    console.error("❌ Error al obtener promedios generales:", error);
    res.status(500).json({
      status: false,
      message: "Error al obtener promedios generales.",
      error: error.message
    });
  }
};