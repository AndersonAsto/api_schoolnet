const TeacherAssignments = require('../models/teacherAssignments.model');
const Persons = require('../models/persons.model');
const Years = require('../models/years.model');
const Courses = require('../models/courses.model');

exports.createTeacherAssignment = async (req, res) => {
    try {

        const {personId, yearId, courseId} = req.body;

        if (!personId || !yearId)
            return res.status(400).json({error: 'No ha completado algunos campos'});

        const newTeacherAssignament = await TeacherAssignments.create({personId, yearId, courseId});
        res.status(201).json(newTeacherAssignament);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getTeacherAssignments = async (req, res) => {
    try {
        const teacherAssignments = await TeacherAssignments.findAll({
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
                    attributes: ['id', 'course']
                }
            ],
            attributes: ['id', 'status', 'createdAt', 'updatedAt']
        });
        res.json(teacherAssignments)

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.updateTeacherAssignment = async (req, res) => {
    const {id} = req.params;
    const {personId, yearId, courseId} = req.body;
    try {
        const teachers = await TeacherAssignments.findByPk(id);

        if (!teachers) {
            return res.status(404).json({message: 'Docente no encontrado.'});
        }

        teachers.personId = personId;
        teachers.yearId = yearId;
        teachers.courseId = courseId;

        await teachers.save();
        res.status(200).json(teachers);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.deleteTeacherAssignment = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({message: 'Identificador inválido o no proporcionado.'});
        }

        const deleted = await TeacherAssignments.destroy({where: {id}});

        if (deleted === 0) {
            return res.status(404).json({message: 'Docente no encontrado.'});
        }

        res.status(200).json({message: 'Docente eliminado correctamente.'});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}
