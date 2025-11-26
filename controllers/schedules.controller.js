const Schedules = require('../models/schedules.model');
const Grades = require('../models/grades.model');
const Years = require('../models/years.model');
const TeacherAssignments = require('../models/teacherAssignments.model');
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
            return res.status(400).json({message: 'No ha completado los campos requeridos:'});

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
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
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
        res.status(200).json(schedules);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.updateSchedule = async (req, res) => {
    const {id} = req.params;
    const {yearId, teacherId, courseId, gradeId, sectionId, weekday, startTime, endTime} = req.body;
    try {
        const schedules = await Schedules.findByPk(id);

        if (!schedules) {
            return res.status(404).json({message: 'Horario no encontrado.'});
        }

        schedules.yearId = yearId;
        schedules.teacherId = teacherId;
        schedules.courseId = courseId;
        schedules.gradeId = gradeId;
        schedules.sectionId = sectionId;
        schedules.weekday = weekday;
        schedules.startTime = startTime;
        schedules.endTime = endTime;

        await schedules.save();
        res.status(200).json(schedules);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.deleteSchedule = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({message: 'Identificador inválido o no proporcionado.'});
        }

        const deleted = await Schedules.destroy({where: {id}});

        if (deleted === 0) {
            return res.status(404).json({message: 'Horario no encontrado.'});
        }

        res.status(200).json({message: 'Horario eliminado correctamente.'});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getSchedulesByUser = async (req, res) => {
    try {
        const {userId} = req.params;

        // Buscar el usuario
        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({error: "Usuario no encontrado"});
        }

        // Buscar la persona asociada (suponiendo que Users tiene personId)
        const person = await Persons.findByPk(user.personId);
        if (!person) {
            return res.status(404).json({error: "Persona asociada no encontrada"});
        }

        // Buscar asignación del docente
        const teacherAssignment = await TeacherAssignments.findOne({
            where: {personId: person.id},
        });
        if (!teacherAssignment) {
            return res.status(404).json({error: "No se encontró asignación de docente"});
        }

        // Buscar horarios asociados a ese docente
        const schedules = await Schedules.findAll({
            where: {teacherId: teacherAssignment.id}, // ajusta si tu campo se llama diferente
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
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.getSchedulesByYearAndUser = async (req, res) => {
    try {
        const {userId, yearId} = req.params;

        if (!userId || !yearId) {
            return res.status(400).json({message: "El identificador del usuario y del año son requeridos"});
        }

        // Buscar el usuario
        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({message: "Usuario no encontrado"});
        }

        // Buscar la persona asociada
        const person = await Persons.findByPk(user.personId);
        if (!person) {
            return res.status(404).json({message: "Persona asociada no encontrada"});
        }

        // Buscar asignación docente
        const teacherAssignment = await TeacherAssignments.findOne({
            where: {personId: person.id},
        });
        if (!teacherAssignment) {
            return res.status(404).json({message: "No se encontró asignación de docente"});
        }

        // Buscar horarios del docente filtrados por año
        const schedules = await Schedules.findAll({
            where: {
                teacherId: teacherAssignment.id,
                yearId, // filtro clave
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
            order: [[{model: Grades, as: 'grades'}, 'grade', "ASC"]],
        });

        res.status(200).json(schedules);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.getSchedulesByTeacher = async (req, res) => {
    try {

        const {teacherId} = req.params;

        const teacherAssignment = await Users.findByPk(teacherId);
        if (!teacherAssignment) {
            return res.status(404).json({error: "Asignación de docente no encontrada"});
        }

        const person = await Persons.findByPk(teacherAssignment.personId);
        if (!person) {
            return res.status(404).json({error: "Persona asociada no encontrada"});
        }

        const schedules = await Schedules.findAll({
            where: {teacherId: teacherAssignment.id},
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
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getSchedulesByYear = async (req, res) => {
    try {
        const { yearId } = req.params;

        const schedulesByYear = await Schedules.findAll({
            where: { yearId },
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
            attributes: ['id', 'weekday', 'startTime', 'endTime', 'status', 'createdAt', 'updatedAt'],
            order: [[{model: TeacherAssignments, as: "teachers"}, "id", "ASC"]],
        });
        res.status(200).json(schedulesByYear);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}
