const Incidents = require('../models/incidents.model');
const StudentsEnrollments = require('../models/studentsEnrollments.model');
const Schedules = require('../models/schedules.model');
const SchoolDays = require('../models/teachingDays.model');
const Persons = require('../models/persons.model');
const Grades = require('../models/grades.model');
const Sections = require('../models/sections.model');
const Courses = require('../models/courses.model');

exports.createIncident = async (req, res) => {
  try {
    const { studentId, scheduleId, schoolDayId, incidentDetail } = req.body;

    if (!studentId || !scheduleId || !schoolDayId) {
      return res.status(400).json({
        message: "Los campos studentId, scheduleId y schoolDayId son obligatorios."
      });
    }

    const newIncident = await Incidents.create({
      studentId,
      scheduleId,
      schoolDayId,
      incidentDetail
    });

    return res.status(201).json({
      message: "Incidencia registrada correctamente.",
      data: newIncident
    });
  } catch (error) {
    console.error("Error al registrar incidencia:", error);
    return res.status(500).json({
      message: "Error al registrar incidencia.",
      error: error.message
    });
  }
};

exports.getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incidents.findAll({
      include: [
        {
          model: StudentsEnrollments,
          as: 'students',
          include: [
            {
              model: Persons,
              as: 'persons',
              attributes: ['names', 'lastNames', 'dni']
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
        },
        {
          model: Schedules,
          as: 'schedules',
          include: [
            {
              model: Courses,
              as: 'courses',
              attributes: ['course']
            }
          ]
        },
        {
          model: SchoolDays,
          as: 'schooldays',
          attributes: ['id', 'teachingDay']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      message: "Lista de incidencias obtenida correctamente.",
      data: incidents
    });
  } catch (error) {
    console.error("Error al obtener incidencias:", error);
    return res.status(500).json({
      message: "Error al obtener incidencias.",
      error: error.message
    });
  }
};

exports.getByStudentAndSchedule = async (req, res) => {
  try {
    const { studentId, scheduleId } = req.params;

    const incidents = await Incidents.findAll({
      where: { studentId, scheduleId },
      include: [
        {
          model: StudentsEnrollments,
          as: 'students',
          include: [
            { model: Persons, 
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
            }
            ]
        },
        { model: SchoolDays, as: 'schooldays', attributes: ['teachingDay'] },
        {
          model: Schedules,
          as: 'schedules',
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
        },
      ],
      order: [[{ model: SchoolDays, as: 'schooldays' }, 'teachingDay', 'ASC']]
    });

    res.json(incidents);
  } catch (error) {
    console.error('❌ Error obteniendo incidencias:', error);
    res.status(500).json({ message: 'Error obteniendo incidencias', error });
  }
};