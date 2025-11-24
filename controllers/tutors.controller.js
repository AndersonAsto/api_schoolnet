const Tutors = require('../models/tutors.model');
const Grades = require('../models/grades.model');
const Years = require('../models/years.model');
const TeacherAssignments = require('../models/teacherAssignments.model');
const Sections = require('../models/sections.model');
const Persons = require('../models/persons.model');
const Courses = require('../models/courses.model');
const StudentsEnrollments = require('../models/studentEnrollments.model');

exports.createTutor = async (req, res) => {
    try {
        const { teacherId, gradeId, sectionId } = req.body;

        if (!teacherId || !gradeId || !sectionId)
            return res.status(400).json({ message: 'No se han completado los campos requeridos (docente, grado o sección). '});

        const newTutor = await Tutors.create({ teacherId, gradeId, sectionId });

        res.status(201).json(newTutor);
    } catch (error) {
        console.error('Error al crear tutor: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getTutors = async (req, res) => {
    try {
        const tutors = await Tutors.findAll({
            include: [
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
                        {
                            model: Courses,
                            as: 'courses',
                            attributes: ['id', 'course', 'descripcion']
                        },
                    ]
                },
                {
                    model: Grades,
                    as: 'grades',
                    attributes: ['id', 'grade']
                },
                {
                    model: Sections,
                    as: 'sections',
                    attributes: ['id', 'seccion']
                }
            ]
        });
        res.status(200).json(tutors);
    } catch (error) {
        console.error('Error al obtener datos de tutores: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getTutorByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        const group = await StudentsEnrollments.findByPk(studentId);
        if (!group) 
            return res.status(404).json({ message: "Estudiante no encontrado." });

        const tutorByStudent = await Tutors.findOne({
            where: {
                gradeId: group.gradeId,
                sectionId: group.sectionId,
            },
            include: [
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
                        {
                            model: Courses,
                            as: 'courses',
                            attributes: ['id', 'course', 'descripcion']
                        },
                    ]
                },
                {
                    model: Grades,
                    as: 'grades',
                    attributes: ['id', 'grade']
                },
                {
                    model: Sections,
                    as: 'sections',
                    attributes: ['id', 'seccion']
                }
            ]
        });
        res.status(200).json(tutorByStudent);
    } catch (error) {
        console.error('Error al obtener datos de tutor por estudiante: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getTutorsById = async (req, res) => {
    try {
        const { id } = req.params; 
        const tutors = await Tutors.findAll({
            where: { id },
            include: [
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
                        {
                            model: Courses,
                            as: 'courses',
                            attributes: ['id', 'course', 'descripcion']
                        },
                    ]
                },
                {
                    model: Grades,
                    as: 'grades',
                    attributes: ['id', 'grade']
                },
                {
                    model: Sections,
                    as: 'sections',
                    attributes: ['id', 'seccion']
                }
            ]
        });
        res.status(200).json(tutors);
    } catch (error) {
        console.error('Error al obtener datos de tutor por identificador: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.updateTutor = async (req, res) => {
    const { id } = req.params;
    const { teacherId, gradeId, sectionId } = req.body;
    try {
        const tutors = await Tutors.findByPk(id);

        if (!tutors)
            return res.status(404).json({ message: 'Tutor no encontrado.' });

        tutors.teacherId = teacherId;
        tutors.gradeId = gradeId;
        tutors.sectionId = sectionId;

        await tutors.save();
        res.status(200).json(tutors);
    } catch (error) {
        console.error('Error al actualizar datos de tutor: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.deleteTutor = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) 
            return res.status(400).json({ message: 'Identificador inválido o no proporcionado.' });

        const deleted = await Tutors.destroy({ where: { id } });

        if (deleted === 0)
            return res.status(404).json({ message: 'Tutor no encontrado. '});

        res.status(200).json({ message: 'Tutor eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar datos de tutor: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getTutorsByYear = async (req, res) => {
    try {
        const { yearId } = req.params;

        if (!yearId)
            res.status(404).json('No ha seleccioando un año.');

        const tutors = await Tutors.findAll({
            where: { yearId },
            include: [
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
                        {
                            model: Courses,
                            as: 'courses',
                            attributes: ['id', 'course', 'descripcion']
                        },
                    ]
                },
                {
                    model: Grades,
                    as: 'grades',
                    attributes: ['id', 'grade']
                },
                {
                    model: Sections,
                    as: 'sections',
                    attributes: ['id', 'seccion']
                }
            ]
        });
        res.status(200).json(tutors);
    } catch (error) {
        console.error('Error al obtener datos de tutores: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}
