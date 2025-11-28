const db = require('../models');

exports.createTeacherGroup = async (req, res) => {
    try {
        const {teacherAssignmentId, yearId, courseId, gradeId, sectionId} = req.body;

        if (!teacherAssignmentId || !yearId || !courseId || !gradeId || !sectionId)
            return res.status(400).json({message: 'No se han completado los campos requeridos. '});

        const newTeacherGroup = await db.TeacherGroups.create({
            teacherAssignmentId, yearId, courseId, gradeId, sectionId
        });

        res.status(201).json(newTeacherGroup);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getTeacherGroups = async (req, res) => {
    try {
        const teacherGroups = await db.TeacherGroups.findAll({
            include: [
                {
                    model: db.TeacherAssignments,
                    as: 'teacherassignments',
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
                },
                {
                    model: db.Years,
                    as: 'years',
                    attributes: ['id', 'year']
                },
                {
                    model: db.Courses,
                    as: 'courses',
                    attributes: ['id', 'course', 'recurrence']
                },
                {
                    model: db.Grades,
                    as: 'grades',
                    attributes: ['id', 'grade']
                },
                {
                    model: db.Sections,
                    as: 'sections',
                    attributes: ['id', 'seccion']
                }
            ]
        });
        res.status(200).json(teacherGroups);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getTeacherGroupsByYearAndUser = async (req, res) => {
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

        const teacherGroups = await db.TeacherGroups.findAll({
            where: {
                teacherAssignmentId: teacherAssignment.id,
                yearId,
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
                    as: "teacherassignments",
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
            attributes: ["id"],
            order: [[{model: db.Grades, as: 'grades'}, 'grade', "ASC"]],
        });
        res.status(200).json(teacherGroups);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getTeacherGroupsByYearAndTutor = async (req, res) => {
    try {
        const {yearId, tutorId} = req.params;

        if (!tutorId)
            return res.status(400).json({message: "El identificador del grupo de tutor es requerido."});

        const group = await db.Tutors.findByPk(tutorId);
        if (!group)
            return res.status(404).json({message: "Grupo de tutor no encontrado."});

        const teacherGroups = await db.TeacherGroups.findAll({
            where: {
                gradeId: group.gradeId,
                sectionId: group.sectionId,
                yearId,
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
                    as: "teacherassignments",
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
            attributes: ["id"],
            order: [[{model: db.Grades, as: 'grades'}, 'grade', "ASC"]],
        });
        res.status(200).json(teacherGroups);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.updateTeacherGroup = async (req, res) => {
    const {id} = req.params;
    const {teacherAssignmentId, yearId, courseId, gradeId, sectionId} = req.body;
    try {
        const teacherGroups = await db.TeacherGroups.findByPk(id);

        if (!teacherGroups)
            return res.status(404).json({message: 'Grupo de docente no encontrado.'});

        teacherGroups.teacherAssignmentId = teacherAssignmentId;
        teacherGroups.yearId = yearId;
        teacherGroups.courseId = courseId;
        teacherGroups.gradeId = gradeId;
        teacherGroups.sectionId = sectionId;

        await teacherGroups.save();
        res.status(200).json(teacherGroups);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.deleteTeacherGroup = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id))
            return res.status(400).json({message: 'Identificador inválido o no proporcionado.'});

        const deleted = await db.TeacherGroups.destroy({where: {id}});

        if (deleted === 0)
            return res.status(404).json({message: 'Grupo de docente no encontrado. '});

        res.status(200).json({message: 'Grupo de docente eliminado correctamente.'});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}
