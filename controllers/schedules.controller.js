const db = require('../models');

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

        const newSchedule = await db.Schedules.create({
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
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getSchedules = async (req, res) => {
    try {
        const schedules = await db.Schedules.findAll({
            include: [
                {
                    model: db.Years,
                    as: 'years',
                    attributes: ['id', 'year']
                },
                {
                    model: db.Courses,
                    as: 'courses',
                    attributes: ['id', 'course']
                },
                {
                    model: db.Sections,
                    as: 'sections',
                    attributes: ['id', 'seccion']
                },
                {
                    model: db.Grades,
                    as: 'grades',
                    attributes: ['id', 'grade']
                },
                {
                    model: db.TeacherAssignments,
                    as: 'teachers',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames', 'role']
                        },
                        {
                            model: db.Years,
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
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.updateSchedule = async (req, res) => {
    const {id} = req.params;
    const {yearId, teacherId, courseId, gradeId, sectionId, weekday, startTime, endTime} = req.body;
    try {
        const schedules = await db.Schedules.findByPk(id);

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
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.deleteSchedule = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({message: 'Identificador inválido o no proporcionado.'});
        }

        const deleted = await db.Schedules.destroy({where: {id}});

        if (deleted === 0) {
            return res.status(404).json({message: 'Horario no encontrado.'});
        }

        res.status(200).json({message: 'Horario eliminado correctamente.'});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getSchedulesByUser = async (req, res) => {
    try {
        const {userId} = req.params;

        // Buscar el usuario
        const user = await db.Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({error: "Usuario no encontrado"});
        }

        // Buscar la persona asociada (suponiendo que Users tiene personId)
        const person = await db.Persons.findByPk(user.personId);
        if (!person) {
            return res.status(404).json({error: "Persona asociada no encontrada"});
        }

        // Buscar asignación del docente
        const teacherAssignment = await db.TeacherAssignments.findOne({
            where: {personId: person.id},
        });
        if (!teacherAssignment) {
            return res.status(404).json({error: "No se encontró asignación de docente"});
        }

        // Buscar horarios asociados a ese docente
        const schedules = await db.Schedules.findAll({
            where: {teacherId: teacherAssignment.id},
            include: [
                {
                    model: db.Years,
                    as: "years",
                    attributes: ["id", "year"],
                },
                {
                    model: db.Courses,
                    as: "courses",
                    attributes: ["id", "course"],
                },
                {
                    model: db.Sections,
                    as: "sections",
                    attributes: ["id", "seccion"],
                },
                {
                    model: db.Grades,
                    as: "grades",
                    attributes: ["id", "grade"],
                },
                {
                    model: db.TeacherAssignments,
                    as: "teachers",
                    attributes: ["id"],
                    include: [
                        {
                            model: db.Persons,
                            as: "persons",
                            attributes: ["id", "names", "lastNames", "role"],
                        },
                        {
                            model: db.Years,
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
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getSchedulesByYearAndUser = async (req, res) => {
    try {
        const {userId, yearId} = req.params;

        if (!userId || !yearId) {
            return res.status(400).json({message: "El identificador del usuario y del año son requeridos"});
        }

        // Buscar el usuario
        const user = await db.Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({message: "Usuario no encontrado"});
        }

        // Buscar la persona asociada
        const person = await db.Persons.findByPk(user.personId);
        if (!person) {
            return res.status(404).json({message: "Persona asociada no encontrada"});
        }

        // Buscar asignación docente
        const teacherAssignment = await db.TeacherAssignments.findOne({
            where: {personId: person.id},
        });
        if (!teacherAssignment) {
            return res.status(404).json({message: "No se encontró asignación de docente"});
        }

        // Buscar horarios del docente filtrados por año
        const schedules = await db.Schedules.findAll({
            where: {
                teacherId: teacherAssignment.id,
                yearId, // filtro clave
            },
            include: [
                {
                    model: db.Years,
                    as: "years",
                    attributes: ["id", "year"],
                },
                {
                    model: db.Courses,
                    as: "courses",
                    attributes: ["id", "course"],
                },
                {
                    model: db.Sections,
                    as: "sections",
                    attributes: ["id", "seccion"],
                },
                {
                    model: db.Grades,
                    as: "grades",
                    attributes: ["id", "grade"],
                },
                {
                    model: db.TeacherAssignments,
                    as: "teachers",
                    attributes: ["id"],
                    include: [
                        {
                            model: db.Persons,
                            as: "persons",
                            attributes: ["id", "names", "lastNames", "role"],
                        },
                        {
                            model: db.Years,
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
            order: [[{model: db.Grades, as: 'grades'}, 'grade', "ASC"]],
        });
        res.status(200).json(schedules);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getSchedulesByTeacher = async (req, res) => {
    try {

        const {teacherId} = req.params;

        const teacherAssignment = await db.Users.findByPk(teacherId);
        if (!teacherAssignment) {
            return res.status(404).json({error: "Asignación de docente no encontrada"});
        }

        const person = await db.Persons.findByPk(teacherAssignment.personId);
        if (!person) {
            return res.status(404).json({error: "Persona asociada no encontrada"});
        }

        const schedules = await db.Schedules.findAll({
            where: {teacherId: teacherAssignment.id},
            include: [
                {
                    model: db.Years,
                    as: 'years',
                    attributes: ['id', 'year']
                },
                {
                    model: db.Courses,
                    as: 'courses',
                    attributes: ['id', 'course']
                },
                {
                    model: db.Sections,
                    as: 'sections',
                    attributes: ['id', 'seccion']
                },
                {
                    model: db.Grades,
                    as: 'grades',
                    attributes: ['id', 'grade']
                },
                {
                    model: db.TeacherAssignments,
                    as: 'teachers',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames', 'role']
                        },
                        {
                            model: db.Years,
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
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getSchedulesByYear = async (req, res) => {
    try {
        const {yearId} = req.params;

        const schedulesByYear = await db.Schedules.findAll({
            where: {yearId},
            include: [
                {
                    model: db.Years,
                    as: 'years',
                    attributes: ['id', 'year']
                },
                {
                    model: db.Courses,
                    as: 'courses',
                    attributes: ['id', 'course']
                },
                {
                    model: db.Sections,
                    as: 'sections',
                    attributes: ['id', 'seccion']
                },
                {
                    model: db.Grades,
                    as: 'grades',
                    attributes: ['id', 'grade']
                },
                {
                    model: db.TeacherAssignments,
                    as: 'teachers',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames', 'role']
                        },
                        {
                            model: db.Years,
                            as: 'years',
                            attributes: ['id', 'year']
                        },
                    ]
                }
            ],
            attributes: ['id', 'weekday', 'startTime', 'endTime', 'status', 'createdAt', 'updatedAt'],
            order: [[{model: db.TeacherAssignments, as: "teachers"}, "id", "ASC"]],
        });
        res.status(200).json(schedulesByYear);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}
