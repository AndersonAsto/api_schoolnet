const { Op } = require("sequelize");
const TeachingBlockAvarage = require("../models/teachingBlockAvarage.model");
const Exams = require("../models/exams.model");
const TeachingBlocks = require("../models/teachingBlocks.model");
const Schedules = require("../models/schedules.model");
const StudentsEnrollments = require("../models/studentsEnrollments.model");
const Courses = require("../models/courses.model");
const Grades = require("../models/grades.model");
const Sections = require("../models/sections.model");
const Persons = require("../models/persons.model");
const Years = require("../models/years.model");

exports.calculateAndSaveAverage = async (req, res) => {
  try {
    const { studentId, scheduleId, teachingBlockId } = req.body;

    // Validación básica
    if (!studentId || !scheduleId || !teachingBlockId) {
      return res.status(400).json({
        message: "Faltan parámetros obligatorios (studentId, scheduleId, teachingBlockId).",
      });
    }

    // 1️⃣ Obtener el rango de fechas del bloque lectivo
    const block = await TeachingBlocks.findByPk(teachingBlockId);
    if (!block) {
      return res.status(404).json({ message: "Bloque lectivo no encontrado." });
    }

    const { startDay, endDay } = block;

    // 2️⃣ Buscar todas las calificaciones y exámenes del estudiante dentro del rango
    const exams = await Exams.findAll({
      where: {
        studentId,
        scheduleId,
        teachingBlockId,
        type: { [Op.in]: ["Práctica", "Examen"] },
      },
    });

    if (!exams.length) {
      return res.status(404).json({
        message: "No se encontraron calificaciones ni exámenes en este bloque lectivo.",
      });
    }

    // 3️⃣ Separar prácticas y exámenes
    const grades = exams.filter(e => e.type === "Práctica");
    const tests = exams.filter(e => e.type === "Examen");

    // 4️⃣ Calcular los promedios simples
    const gradeAverage = grades.length
      ? grades.reduce((sum, e) => sum + parseFloat(e.score), 0) / grades.length
      : 0;

    const examAverage = tests.length
      ? tests.reduce((sum, e) => sum + parseFloat(e.score), 0) / tests.length
      : 0;

    // 5️⃣ Ponderación: 0.6 prácticas + 0.4 exámenes
    const teachingBlockAverage = (gradeAverage * 0.6) + (examAverage * 0.4);

    // 6️⃣ Guardar o actualizar el registro
    const [record, created] = await TeachingBlockAvarage.findOrCreate({
      where: { studentId, scheduleId, teachingBlockId },
      defaults: {
        gradeAvarage: gradeAverage.toFixed(2),
        examAvarage: examAverage.toFixed(2),
        teachingblockavarage: teachingBlockAverage.toFixed(2),
        status: true,
      },
    });

    if (!created) {
      // Si ya existe, actualizamos los promedios
      await record.update({
        gradeAvarage: gradeAverage.toFixed(2),
        examAvarage: examAverage.toFixed(2),
        teachingblockavarage: teachingBlockAverage.toFixed(2),
      });
    }

    return res.status(200).json({
      message: created ? "Promedio registrado correctamente." : "Promedio actualizado correctamente.",
      data: record,
    });

  } catch (error) {
    console.error("❌ Error al calcular el promedio de bloque lectivo:", error);
    res.status(500).json({
      message: "Error al calcular el promedio de bloque lectivo.",
      error: error.message,
    });
  }
};

exports.getAveragesByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const averages = await TeachingBlockAvarage.findAll({
      where: { studentId },
      include: [
        {
          model: TeachingBlocks,
          as: "teachingblocks",
          attributes: ["id", "teachingBlock", "startDay", "endDay"],
        },
        {
          model: Schedules,
          as: "schedules",
          attributes: ["id", "weekday", "startTime", "endTime"],
          include: [
            {
              model: Courses,
              as: "courses",
              attributes: ["id", "course"],
            },
            {
              model: Grades,
              as: "grades",
              attributes: ["id", "grade"],
            },
            {
              model: Sections,
              as: "sections",
              attributes: ["id", "seccion"],
            },
            {
              model: Years,
              as: "years",
              attributes: ['id', 'year']
            }
          ],
        },
        {
          model: StudentsEnrollments,
          as: "students",
          attributes: ["id"],
          include: [
            {
              model: Persons,
              as: "persons",
              attributes: ["id", "names", "lastNames"],
            },
          ],
        },
      ],
      order: [["teachingBlockId", "ASC"]],
    });

    if (!averages.length) {
      return res.status(404).json({
        message: "No se encontraron promedios de bloque lectivo para este estudiante.",
      });
    }

    res.status(200).json(averages);
  } catch (error) {
    console.error("❌ Error al obtener promedios del estudiante:", error);
    res.status(500).json({
      message: "Error al obtener promedios del estudiante.",
      error: error.message,
    });
  }
};

exports.getAveragesBySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const averages = await TeachingBlockAvarage.findAll({
      where: { scheduleId },
      include: [
        {
          model: TeachingBlocks,
          as: "teachingblocks",
          attributes: ["id", "teachingBlock", "startDay", "endDay"],
        },
        {
          model: StudentsEnrollments,
          as: "students",
          attributes: ["id"],
          include: [
            {
              model: Persons,
              as: "persons",
              attributes: ["names", "lastNames"],
            },
          ],
        },
      ],
      order: [
        ["teachingBlockId", "ASC"],
        [{ model: StudentsEnrollments, as: "students" }, "id", "ASC"],
      ],
    });

    if (!averages.length) {
      return res.status(404).json({
        message: "No se encontraron promedios de bloque lectivo para este horario.",
      });
    }

    res.status(200).json(averages);
  } catch (error) {
    console.error("❌ Error al obtener promedios por horario:", error);
    res.status(500).json({
      message: "Error al obtener promedios por horario.",
      error: error.message,
    });
  }
};

exports.getAveragesByBlock = async (req, res) => {
  try {
    const { teachingBlockId } = req.params;

    const averages = await TeachingBlockAvarage.findAll({
      where: { teachingBlockId },
      include: [
        {
          model: StudentsEnrollments,
          as: "students",
          attributes: ["id"],
          include: [
            {
              model: Persons,
              as: "persons",
              attributes: ["names", "lastNames"],
            },
          ],
        },
        {
          model: Schedules,
          as: "schedules",
          attributes: ["id", "weekday"],
          include: [
            {
              model: Courses,
              as: "courses",
              attributes: ["course"],
            },
            {
              model: Grades,
              as: "grades",
              attributes: ["grade"],
            },
            {
              model: Sections,
              as: "sections",
              attributes: ["seccion"],
            },
            {
              model: Years,
              as: "years",
              attributes: ['id', 'year']
            }
          ],
        },
      ],
      order: [["scheduleId", "ASC"]],
    });

    if (!averages.length) {
      return res.status(404).json({
        message: "No se encontraron promedios para este bloque lectivo.",
      });
    }

    res.status(200).json(averages);
  } catch (error) {
    console.error("❌ Error al obtener promedios por bloque lectivo:", error);
    res.status(500).json({
      message: "Error al obtener promedios por bloque lectivo.",
      error: error.message,
    });
  }
};

exports.getAveragesByStudentYearSchedule = async (req, res) => {
  try {
    const { studentId, yearId, scheduleId } = req.params;

    if (!studentId || !yearId || !scheduleId) {
      return res.status(400).json({
        message: "Faltan parámetros: studentId, yearId o scheduleId",
      });
    }

    const averages = await TeachingBlockAvarage.findAll({
      where: {
        studentId,
        scheduleId
      },
      include: [
        {
          model: TeachingBlocks,
          as: "teachingblocks",
          attributes: ["id", "teachingBlock", "startDay", "endDay"],
          where: { yearId } // 🔹 Filtra los bloques lectivos del año
        },
        {
          model: Schedules,
          as: "schedules",
          attributes: ["id", "weekday", "startTime", "endTime"],
          include: [
            {
              model: Courses,
              as: "courses",
              attributes: ["id", "course"],
            },
            {
              model: Grades,
              as: "grades",
              attributes: ["id", "grade"],
            },
            {
              model: Sections,
              as: "sections",
              attributes: ["id", "seccion"],
            },
            {
              model: Years,
              as: "years",
              attributes: ['id', 'year']
            }
          ],
        },
        {
          model: StudentsEnrollments,
          as: "students",
          attributes: ["id"],
          include: [
            {
              model: Persons,
              as: "persons",
              attributes: ["id", "names", "lastNames"],
            },
          ],
        },
      ],
      order: [["teachingBlockId", "ASC"]],
    });

    if (!averages || averages.length === 0) {
      return res.status(404).json({
        message: "No se encontraron promedios de bloque lectivo para este estudiante en el año y horario especificado.",
      });
    }

    res.status(200).json(averages);

  } catch (error) {
    console.error("❌ Error al obtener promedios del estudiante:", error);
    res.status(500).json({
      message: "Error al obtener promedios del estudiante.",
      error: error.message,
    });
  }
};