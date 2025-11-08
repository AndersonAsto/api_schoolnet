const RepresentativesAssignments = require('../models/representativesAssignments.model');
const Persons = require('../models/persons.model');
const Years = require('../models/years.model');
const StudentEnrollments = require('../models/studentsEnrollments.model');

exports.createRepresentativesAssignments = async (req, res) => {
    try {
        
        const { yearId, personId, studentId, relationshipType } = req.body;

        if ( !yearId || !personId || !studentId )
            return res.status(400).json({ message: 'No ha completado los campos requeridos.' });

        const newRepresentativesAssignments = await RepresentativesAssignments.create({
            yearId, personId, studentId, relationshipType
        });
        res.status(201).json(newRepresentativesAssignments);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'No se ha podido crear asignación de apoderado: ', error
        });
    }
}

exports.getRepresentativesAssignments = async (req, res) => {
    try {
        
        const representativesAssignments = await RepresentativesAssignments.findAll({
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
                    model: StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames', 'role']
                        }
                    ]
                }
            ],
            attributes: ['id', 'relationshipType', 'status', 'createdAt', 'updatedAt']
        });
        res.json(representativesAssignments);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener asignaciones de apoderados:', error
        })
    }
}

exports.deleteParentsById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Identificador inválido o no proporcionado.' });
        }

        const deleted = await RepresentativesAssignments.destroy({ where: {id} });

        if (deleted === 0) {
            return res.status(404).json({ message: 'Apoderado no encontrado.' });
        }

        res.status(200).json({ message: 'Apoderado eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar apoderado: ', error.message);
        res.status(500).json({ message: 'Error al eliminar apoderado.'});
    }
}

exports.updateParent = async (req, res) => {
    const { id } = req.params;
    const { yearId, personId, studentId, relationshipType } = req.body;
    try {
        const parents = await RepresentativesAssignments.findByPk(id);

        if(!parents) {
            return res.status(404).json({ message: 'Apoderado no encontrado.' });
        }

        parents.yearId = yearId;
        parents.personId = personId;
        parents.studentId = studentId;
        parents.relationshipType = relationshipType;

        await parents.save();
        res.status(200).json(parents);
    } catch (error) {
        console.error('Error al actualizar apoderado: ', error.message);
        res.status(500).json({ message: 'Error al actualizar apoderado.' });
    }
}