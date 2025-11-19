const Courses = require('../models/courses.model');
const Grades = require('../models/grades.model');
const Persons = require('../models/persons.model');
const Sections = require('../models/sections.model');
const TeacherGroups = require('../models/teacherGroups.model');
const TeacherAssignments = require('../models/teacherAssignments.model');
const Users = require('../models/users.model');
const Years = require('../models/years.model');

exports.createTeacherGroup = async (req, res) => {
    try {
        const { teacherAssignmentId, yearId, courseId, gradeId, sectionId } = req.body;

        if (!teacherAssignmentId || !yearId || !courseId || !gradeId || !sectionId)
            return res.status(400).json({ message: 'No se han completado los campos requeridos. '});

        const newTeacherGroup = await TeacherGroups.create({
            teacherAssignmentId, yearId, courseId, gradeId, sectionId
        });

        res.status(201).json(newTeacherGroup);
    } catch (error) {
        console.error('Error al crear grupo de docente: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getTeacherGroups = async (req, res) => {
    try {
        const teacherGroups = await TeacherGroups.findAll({
            include: [
                {
                    model: TeacherAssignments,
                    as: 'teacherassignments',
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
        res.status(200).json(teacherGroups);
    } catch (error) {
        console.error('Error al obtener grupos de docentes: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getGroupsByUserYear = async (req, res) => {
    try {
        const {userId, yearId} = req.params;

        if (!userId || !yearId) {
            return res.status(400).json({message: "El identificador del usuario y del año son requeridos"});
        }

        // 1️⃣ Buscar el usuario
        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({message: "Usuario no encontrado"});
        }

        // 2️⃣ Buscar la persona asociada
        const person = await Persons.findByPk(user.personId);
        if (!person) {
            return res.status(404).json({message: "Persona asociada no encontrada"});
        }

        // 3️⃣ Buscar asignación docente
        const teacherAssignment = await TeacherAssignments.findOne({
            where: {personId: person.id},
        });

        if (!teacherAssignment) {
            return res.status(404).json({message: "No se encontró asignación de docente"});
        }

        const teacherGroups = await TeacherGroups.findAll({
            where: {
                teacherAssignmentId: teacherAssignment.id,
                yearId,
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
                    as: "teacherassignments",
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
            attributes: ["id"],
            order: [[{model: Grades, as: 'grades'}, 'grade', "ASC"]],
        });

        res.status(200).json(teacherGroups);
    } catch (error) {
        console.error("Error al obtener grupos asignados", error);
        res.status(500).json({
            message: "Error al obtener horarios del docente por año",
            error: error.message,
        });
    }
}

exports.updateTeacherGroup = async (req, res) => {
    const { id } = req.params;
    const { teacherAssignmentId, yearId, courseId, gradeId, sectionId } = req.body;
    try {
        const teacherGroups = await TeacherGroups.findByPk(id);

        if (!teacherGroups)
            return res.status(404).json({ message: 'Grupo de docente no encontrado.' });

        teacherGroups.teacherAssignmentId = teacherAssignmentId;
        teacherGroups.yearId = yearId;
        teacherGroups.courseId = courseId;
        teacherGroups.gradeId = gradeId;
        teacherGroups.sectionId = sectionId;

        await teacherGroups.save();
        res.status(200).json(teacherGroups);
    } catch (error) {
        console.error('Error al actualizar grupo de docente: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.deleteTeacherGroup = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) 
            return res.status(400).json({ message: 'Identificador inválido o no proporcionado.' });

        const deleted = await TeacherGroups.destroy({ where: { id } });

        if (deleted === 0)
            return res.status(404).json({ message: 'Grupo de docente no encontrado. '});

        res.status(200).json({ message: 'Grupo de docente eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar grupo de docente: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}
