const Schedules = require('../models/schedules.model');
const Grades = require('../models/grades.model');
const Years = require('../models/years.model');
const TeacherAssignments = require('../models/teachersAssignments.model');
const Sections = require('../models/sections.model');
const Courses = require('../models/courses.model');
const Persons = require('../models/persons.model');

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

        if( !yearId || !teacherId|| !courseId || !gradeId || !sectionId || !weekday || !startTime || !endTime )
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