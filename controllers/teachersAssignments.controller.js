const TeacherAssignments = require('../models/teachersAssignments.model');
const Persons = require('../models/persons.model');
const Years = require('../models/years.model');

exports.createTeacherAssignament = async (req, res) => {
    try {
        
        const { personId, yearId, specialty } = req.body;

        if (!personId || !yearId)
            return res.status(400).json({ error: 'No ha completado algunos campos' });

        const newTeacherAssignament = await TeacherAssignments.create({ personId, yearId, specialty });
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
                }
            ],
            attributes: ['id', 'specialty', 'status', 'createdAt', 'updatedAt']
        });
        res.json(teacherAssignments)
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener asignaciones de docentes', error });
    }
}