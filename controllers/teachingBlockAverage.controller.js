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
const Qualifications = require("../models/qualifications.model");
const TeacherGroups = require("../models/teacherGroups.model");

exports.calculateAndSaveAverage = async (req, res) => {
  try {
    const { studentId, assignmentId, teachingBlockId } = req.body;

    if (!studentId || !assignmentId || !teachingBlockId) {
      return res.status(400).json({ message: 'Faltan parámetros obligatorios (studentId, assignmentId, teachingBlockId)' });
    }

    // 1️⃣ Obtener info del grupo docente (para cruzar grado, sección, curso)
    const group = await TeacherGroups.findByPk(assignmentId);
    if (!group) {
      return res.status(404).json({ message: 'TeacherGroup no encontrado' });
    }

    const { gradeId, sectionId, courseId } = group;

    // 2️⃣ Buscar calificaciones diarias en Qualifications a través de Schedules
    const qualifications = await Qualifications.findAll({
      include: [
        {
          model: Schedules,
          as: 'schedules',
          where: {
            gradeId,
            sectionId,
            courseId
          },
          attributes: []
        }
      ],
      where: {
        studentId,
        teachingBlockId,
        status: true
      },
      attributes: ['rating']
    });

    const dailyAvarage = qualifications.length
      ? qualifications.reduce((sum, q) => sum + parseFloat(q.rating || 0), 0) / qualifications.length
      : 0;

    // 3️⃣ Buscar prácticas
    const practices = await Exams.findAll({
      where: {
        studentId,
        assigmentId: assignmentId,
        teachingBlockId,
        type: 'Práctica',
        status: true
      },
      attributes: ['score']
    });

    const practiceAvarage = practices.length
      ? practices.reduce((sum, e) => sum + parseFloat(e.score || 0), 0) / practices.length
      : 0;

    // 4️⃣ Buscar exámenes
    const exams = await Exams.findAll({
      where: {
        studentId,
        assigmentId: assignmentId,
        teachingBlockId,
        type: 'Examen',
        status: true
      },
      attributes: ['score']
    });

    const examAvarage = exams.length
      ? exams.reduce((sum, e) => sum + parseFloat(e.score || 0), 0) / exams.length
      : 0;

    // 5️⃣ Promedio ponderado
    const teachingBlockAvarage = (dailyAvarage * 0.3 + practiceAvarage * 0.3 + examAvarage * 0.4).toFixed(2);

    // 6️⃣ Guardar o actualizar TeachingBlockAvarage
    await TeachingBlockAvarage.upsert({
      studentId,
      assignmentId,
      teachingBlockId,
      dailyAvarage,
      practiceAvarage,
      examAvarage,
      teachingBlockAvarage,
      status: true,
      updatedAt: new Date()
    });

    return res.status(200).json({
      message: '✅ Promedio calculado correctamente',
      data: { dailyAvarage, practiceAvarage, examAvarage, teachingBlockAvarage }
    });
  } catch (error) {
    console.error('❌ Error al calcular promedio:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
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
          model: TeacherGroups,
          as: "teachergroups",
          attributes: ["id"],
          include: [
            { model: Courses, as: "courses", attributes: ["id", "course"] },
            { model: Grades, as: "grades", attributes: ["id", "grade"] },
            { model: Sections, as: "sections", attributes: ["id", "seccion"] },
            { model: Years, as: "years", attributes: ["id", "year"] }
          ],
        },
        {
          model: StudentsEnrollments,
          as: "students",
          attributes: ["id"],
          include: [{ model: Persons, as: "persons", attributes: ["id", "names", "lastNames"] }],
        },
      ],
      order: [["teachingBlockId", "ASC"]],
    });

    if (!averages.length) {
      return res.status(404).json({ message: "No se encontraron promedios de bloque lectivo para este estudiante." });
    }

    res.status(200).json(averages);
  } catch (error) {
    console.error("❌ Error al obtener promedios del estudiante:", error);
    res.status(500).json({ message: "Error al obtener promedios del estudiante.", error: error.message });
  }
};

// 📘 Obtener promedios por grupo docente
exports.getAveragesByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const averages = await TeachingBlockAvarage.findAll({
      where: { assignmentId },
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
          include: [{ model: Persons, as: "persons", attributes: ["names", "lastNames"] }],
        },
      ],
      order: [
        ["teachingBlockId", "ASC"],
        [{ model: StudentsEnrollments, as: "students" }, "id", "ASC"],
      ],
    });

    if (!averages.length) {
      return res.status(404).json({ message: "No se encontraron promedios de bloque lectivo para este grupo docente." });
    }

    res.status(200).json(averages);
  } catch (error) {
    console.error("❌ Error al obtener promedios por grupo docente:", error);
    res.status(500).json({ message: "Error al obtener promedios por grupo docente.", error: error.message });
  }
};

// 📘 Obtener promedios por bloque lectivo
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
          include: [{ model: Persons, as: "persons", attributes: ["names", "lastNames"] }],
        },
        {
          model: TeacherGroups,
          as: "teachergroups",
          attributes: ["id"],
          include: [
            { model: Courses, as: "courses", attributes: ["course"] },
            { model: Grades, as: "grades", attributes: ["grade"] },
            { model: Sections, as: "sections", attributes: ["seccion"] },
            { model: Years, as: "years", attributes: ["year"] }
          ],
        },
      ],
      order: [["assignmentId", "ASC"]],
    });

    if (!averages.length) {
      return res.status(404).json({ message: "No se encontraron promedios para este bloque lectivo." });
    }

    res.status(200).json(averages);
  } catch (error) {
    console.error("❌ Error al obtener promedios por bloque lectivo:", error);
    res.status(500).json({ message: "Error al obtener promedios por bloque lectivo.", error: error.message });
  }
};

// 📘 Obtener promedios por estudiante, año y grupo docente
exports.getAveragesByStudentYearAssignment = async (req, res) => {
  try {
    const { studentId, yearId, assignmentId } = req.params;

    if (!studentId || !yearId || !assignmentId) {
      return res.status(400).json({ message: "Faltan parámetros: studentId, yearId o assignmentId" });
    }

    const averages = await TeachingBlockAvarage.findAll({
      where: { studentId, assignmentId },
      include: [
        {
          model: TeachingBlocks,
          as: "teachingblocks",
          attributes: ["id", "teachingBlock", "startDay", "endDay"],
          where: { yearId },
        },
        {
          model: TeacherGroups,
          as: "teachergroups",
          include: [
            { model: Courses, as: "courses", attributes: ["id", "course"] },
            { model: Grades, as: "grades", attributes: ["id", "grade"] },
            { model: Sections, as: "sections", attributes: ["id", "seccion"] },
            { model: Years, as: "years", attributes: ["id", "year"] },
          ],
        },
        {
          model: StudentsEnrollments,
          as: "students",
          attributes: ["id"],
          include: [{ model: Persons, as: "persons", attributes: ["id", "names", "lastNames"] }],
        },
      ],
      order: [["teachingBlockId", "ASC"]],
    });

    if (!averages.length) {
      return res.status(404).json({
        message: "No se encontraron promedios de bloque lectivo para este estudiante en el año y grupo docente especificado.",
      });
    }

    res.status(200).json(averages);
  } catch (error) {
    console.error("❌ Error al obtener promedios del estudiante:", error);
    res.status(500).json({ message: "Error al obtener promedios del estudiante.", error: error.message });
  }
};