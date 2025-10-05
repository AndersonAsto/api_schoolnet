const TeacherAssignments = require('../models/teachersAssignments.model');
const Persons = require('../models/persons.model');
const Years = require('../models/years.model');
const Couses = require('../models/courses.model');

exports.createTeacherAssignament = async (req, res) => {
    try {
        
        const { personId, yearId, courseId } = req.body;

        if (!personId || !yearId)
            return res.status(400).json({ error: 'No ha completado algunos campos' });

        const newTeacherAssignament = await TeacherAssignments.create({ personId, yearId, courseId });
        res.status(201).json(newTeacherAssignament);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear asignaciones de docentes', error });
    }
}

exports.getTeacherAssignaments = async (req, res) => {
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
                    model: Couses,
                    as: 'courses',
                    attributes: ['id', 'course']
                }
            ],
            attributes: ['id', 'status', 'createdAt', 'updatedAt']
        });
        res.json(teacherAssignments)
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener asignaciones de docentes', error });
    }
}