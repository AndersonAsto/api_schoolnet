const Schedules = require('../models/schedules.model');
const Grades = require('../models/grades.model');
const Years = require('../models/years.model');
const TeacherAssignments = require('../models/teachersAssignments.model');
const Sections = require('../models/sections.model');
const Courses = require('../models/courses.model');
const Persons = require('../models/persons.model');
const Users = require('../models/users.model');

exports.createSchedule = async (req, res) => {
  try {

    const {
      yearId,
      teacherId,
      courseId,
      gradeId,
      sectionId,
      weekday,
      startTime,
      endTime
    } = req.body;

    if (!yearId || !teacherId || !courseId || !gradeId || !sectionId || !weekday || !startTime || !endTime)
      return res.status(400).json({ message: 'No ha completado los campos requeridos:', error });

    const newSchedule = await Schedules.create({
      yearId,
      teacherId,
      courseId,
      gradeId,
      sectionId,
      weekday,
      startTime,
      endTime
    });
    res.status(201).json(newSchedule);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al crear horario: ', error
    });
  }
}

exports.getSchedules = async (req, res) => {
  try {

    const schedules = await Schedules.findAll({
      include: [
        {
          model: Years,
          as: 'years',
          attributes: ['id', 'year']
        },
        {
          model: Courses,
          as: 'courses',
          attributes: ['id', 'course']
        },
        {
          model: Sections,
          as: 'sections',
          attributes: ['id', 'seccion']
        },
        {
          model: Grades,
          as: 'grades',
          attributes: ['id', 'grade']
        },
        {
          model: TeacherAssignments,
          as: 'teachers',
          attributes: ['id'],
          include: [
            {
              model: Persons,
              as: 'persons',
              attributes: ['id', 'names', 'lastNames', 'role']
            },
            {
              model: Years,
              as: 'years',
              attributes: ['id', 'year']
            },
          ]
        }
      ],
      attributes: ['id', 'weekday', 'startTime', 'endTime', 'status', 'createdAt', 'updatedAt']
    });
    res.json(schedules);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener horarios:', error
    })
  }
}

exports.getSchedulesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar el usuario
    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Buscar la persona asociada (suponiendo que Users tiene personId)
    const person = await Persons.findByPk(user.personId);
    if (!person) {
      return res.status(404).json({ error: "Persona asociada no encontrada" });
    }

    // Buscar asignación del docente
    const teacherAssignment = await TeacherAssignments.findOne({
      where: { personId: person.id },
    });
    if (!teacherAssignment) {
      return res.status(404).json({ error: "No se encontró asignación de docente" });
    }

    // Buscar horarios asociados a ese docente
    const schedules = await Schedules.findAll({
      where: { teacherId: teacherAssignment.id }, // 👈 ajusta si tu campo se llama diferente
      include: [
        {
          model: Years,
          as: "years",
          attributes: ["id", "year"],
        },
        {
          model: Courses,
          as: "courses",
          attributes: ["id", "course"],
        },
        {
          model: Sections,
          as: "sections",
          attributes: ["id", "seccion"],
        },
        {
          model: Grades,
          as: "grades",
          attributes: ["id", "grade"],
        },
        {
          model: TeacherAssignments,
          as: "teachers",
          attributes: ["id"],
          include: [
            {
              model: Persons,
              as: "persons",
              attributes: ["id", "names", "lastNames", "role"],
            },
            {
              model: Years,
              as: "years",
              attributes: ["id", "year"],
            },
          ],
        },
      ],
      attributes: [
        "id",
        "weekday",
        "startTime",
        "endTime",
        "status",
        "createdAt",
        "updatedAt",
      ],
    });

    res.json(schedules);
  } catch (error) {
    console.error("Error en getSchedulesByUser:", error);
    res.status(500).json({
      message: "Error al obtener horarios del docente",
      error,
    });
  }
};

exports.getSchedulesByUserAndYear = async (req, res) => {
  try {
    const { userId, yearId } = req.params;

    if (!userId || !yearId) {
      return res.status(400).json({ message: "El identificador del usuario y del año son requeridos" });
    }

    // 1️⃣ Buscar el usuario
    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 2️⃣ Buscar la persona asociada
    const person = await Persons.findByPk(user.personId);
    if (!person) {
      return res.status(404).json({ message: "Persona asociada no encontrada" });
    }

    // 3️⃣ Buscar asignación docente
    const teacherAssignment = await TeacherAssignments.findOne({
      where: { personId: person.id },
    });
    if (!teacherAssignment) {
      return res.status(404).json({ message: "No se encontró asignación de docente" });
    }

    // 4️⃣ Buscar horarios del docente filtrados por año
    const schedules = await Schedules.findAll({
      where: {
        teacherId: teacherAssignment.id,
        yearId, // 👈 filtro clave
      },
      include: [
        {
          model: Years,
          as: "years",
          attributes: ["id", "year"],
        },
        {
          model: Courses,
          as: "courses",
          attributes: ["id", "course"],
        },
        {
          model: Sections,
          as: "sections",
          attributes: ["id", "seccion"],
        },
        {
          model: Grades,
          as: "grades",
          attributes: ["id", "grade"],
        },
        {
          model: TeacherAssignments,
          as: "teachers",
          attributes: ["id"],
          include: [
            {
              model: Persons,
              as: "persons",
              attributes: ["id", "names", "lastNames", "role"],
            },
            {
              model: Years,
              as: "years",
              attributes: ["id", "year"],
            },
          ],
        },
      ],
      attributes: [
        "id",
        "weekday",
        "startTime",
        "endTime",
        "status",
        "createdAt",
        "updatedAt",
      ],
      order: [["weekday", "ASC"]],
    });

    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error en getSchedulesByUserAndYear:", error);
    res.status(500).json({
      message: "Error al obtener horarios del docente por año",
      error: error.message,
    });
  }
};

exports.getSchedulesByTeacher = async (req, res) => {
  try {

    const { teacherId } = req.params;

    const teacherAssignment = await Users.findByPk(teacherId);
    if (!teacherAssignment) {
      return res.status(404).json({ error: "Asignación de docente no encontrada" });
    }

    const person = await Persons.findByPk(teacherAssignment.personId);
    if (!person) {
      return res.status(404).json({ error: "Persona asociada no encontrada" });
    }
    
    const schedules = await Schedules.findAll({
      where: { teacherId: teacherAssignment.id },
      include: [
        {
          model: Years,
          as: 'years',
          attributes: ['id', 'year']
        },
        {
          model: Courses,
          as: 'courses',
          attributes: ['id', 'course']
        },
        {
          model: Sections,
          as: 'sections',
          attributes: ['id', 'seccion']
        },
        {
          model: Grades,
          as: 'grades',
          attributes: ['id', 'grade']
        },
        {
          model: TeacherAssignments,
          as: 'teachers',
          attributes: ['id'],
          include: [
            {
              model: Persons,
              as: 'persons',
              attributes: ['id', 'names', 'lastNames', 'role']
            },
            {
              model: Years,
              as: 'years',
              attributes: ['id', 'year']
            },
          ]
        }
      ],
      attributes: ['id', 'weekday', 'startTime', 'endTime', 'status', 'createdAt', 'updatedAt']
    });
    res.json(schedules);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener horarios:', error
    })
  }
}