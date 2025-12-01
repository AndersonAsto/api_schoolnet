const db = require('../models');

exports.createTutor = async (req, res) => {
    try {
        const {teacherId, gradeId, sectionId} = req.body;

        if (!teacherId || !gradeId || !sectionId)
            return res.status(400).json({message: 'No ha completado los campos requeridos (docente, grado o sección). '});

        const newTutor = await db.Tutors.create({teacherId, gradeId, sectionId});
        res.status(201).json(newTutor);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getTutors = async (req, res) => {
    try {
        const tutors = await db.Tutors.findAll({
            include: [
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
                        {
                            model: db.Courses,
                            as: 'courses',
                            attributes: ['id', 'course', 'recurrence']
                        },
                    ]
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
        res.status(200).json(tutors);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getTutorByStudent = async (req, res) => {
    try {
        const {studentId} = req.params;

        const group = await db.StudentEnrollments.findByPk(studentId);
        if (!group)
            return res.status(404).json({message: "Estudiante no encontrado."});

        const tutorByStudent = await db.Tutors.findOne({
            where: {
                gradeId: group.gradeId,
                sectionId: group.sectionId,
            },
            include: [
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
                        {
                            model: db.Courses,
                            as: 'courses',
                            attributes: ['id', 'course', 'recurrence']
                        },
                    ]
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
        res.status(200).json(tutorByStudent);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getTutorsById = async (req, res) => {
    try {
        const {id} = req.params;
        const tutors = await db.Tutors.findAll({
            where: {id},
            include: [
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
                        {
                            model: db.Courses,
                            as: 'courses',
                            attributes: ['id', 'course', 'recurrence']
                        },
                    ]
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
        res.status(200).json(tutors);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.updateTutor = async (req, res) => {
    const {id} = req.params;
    const {teacherId, gradeId, sectionId} = req.body;
    try {
        const tutors = await db.Tutors.findByPk(id);

        if (!tutors)
            return res.status(404).json({message: 'Tutor no encontrado.'});

        tutors.teacherId = teacherId;
        tutors.gradeId = gradeId;
        tutors.sectionId = sectionId;

        await tutors.save();
        res.status(200).json(tutors);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.deleteTutor = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id))
            return res.status(400).json({message: 'Identificador inválido o no proporcionado.'});

        const deleted = await db.Tutors.destroy({where: {id}});

        if (deleted === 0)
            return res.status(404).json({message: 'Tutor no encontrado. '});

        res.status(200).json({message: 'Tutor eliminado correctamente.'});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getTutorsByYear = async (req, res) => {
    try {
        const {yearId} = req.params;
        if (!yearId)
            return res.status(404).json('No ha seleccioando un año.');

        const tutors = await db.Tutors.findAll({
            where: {yearId},
            include: [
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
                        {
                            model: db.Courses,
                            as: 'courses',
                            attributes: ['id', 'course', 'recurrence']
                        },
                    ]
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
        res.status(200).json(tutors);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}
