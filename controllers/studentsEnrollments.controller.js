const StudentEnrollments = require('../models/studentsEnrollments.model');
const Sections = require('../models/sections.model');
const Persons = require('../models/persons.model');
const Grades = require('../models/grades.model');
const Years = require('../models/years.model');
const Schedules = require('../models/schedules.model');

exports.createStudentEnrollment = async (req, res) => {
    try {
        
        const { studentId, yearId, gradeId, sectionId } = req.body;

        if ( !studentId || !yearId || !gradeId || !sectionId )
            return res.status(400).json({ error: 'No ha completado algunos campos' });

        const newStudentEnrollment = await StudentEnrollments.create({
            studentId, yearId, gradeId, sectionId
        })
        res.status(201).json(newStudentEnrollment);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al crear inscipción de estudiante: ', error
        });
    }
}

exports.getStudentEnrollments = async (req, res) => {
    try {
        
        const studentEnrollments = await StudentEnrollments.findAll({
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
                {
                    model: Sections,
                    as: 'sections',
                    attributes: ['id', 'seccion']
                },
                {
                    model: Grades,
                    as: 'grades',
                    attributes: ['id', 'grade']
                }
            ],
            attributes: ['id', 'status', 'createdAt', 'updatedAt']
        });
        res.json(studentEnrollments);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener incripciones de estudiantes', error
        });
    }
}

exports.getStudentsBySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return res.status(400).json({ message: "El identificador del horario es requerido" });
    }

    // 🔹 Buscar el horario seleccionado
    const schedule = await Schedules.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    // 🔹 Buscar estudiantes del mismo grado y sección (y opcionalmente mismo año)
    const students = await StudentEnrollments.findAll({
      where: {
        gradeId: schedule.gradeId,
        sectionId: schedule.sectionId,
        yearId: schedule.yearId, // 🔸 opcional si deseas filtrar también por año
        status: true,
      },
      include: [
        {
          model: Persons,
          as: "persons",
          attributes: ["id", "names", "lastNames", "role"],
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
          attributes: ["id", "year"],
        },
      ],
      order: [["id", "ASC"]],
    });

    return res.status(200).json(students);
  } catch (error) {
    console.error("Error en getStudentsBySchedule:", error);
    return res.status(500).json({
      message: "Error al obtener los estudiantes por horario",
      error: error.message,
    });
  }
};