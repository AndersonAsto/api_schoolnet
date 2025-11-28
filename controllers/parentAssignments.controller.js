const db = require('../models');

exports.createParentAssignment = async (req, res) => {
    try {

        const {yearId, personId, studentId, relationshipType} = req.body;

        if (!yearId || !personId || !studentId)
            return res.status(400).json({message: 'No ha completado los campos requeridos.'});

        const newRepresentativesAssignments = await db.ParentAssignments.create({
            yearId, personId, studentId, relationshipType
        });
        res.status(201).json(newRepresentativesAssignments);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getParentAssignments = async (req, res) => {
    try {
        const representativesAssignments = await db.ParentAssignments.findAll({
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
                    model: db.StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
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
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.updateParentAssignment = async (req, res) => {
    const {id} = req.params;
    const {yearId, personId, studentId, relationshipType} = req.body;
    try {
        const parents = await db.ParentAssignments.findByPk(id);

        if (!parents) {
            return res.status(404).json({message: 'Apoderado no encontrado.'});
        }

        parents.yearId = yearId;
        parents.personId = personId;
        parents.studentId = studentId;
        parents.relationshipType = relationshipType;

        await parents.save();
        res.status(200).json(parents);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.deleteParentAssignment = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({message: 'Identificador inválido o no proporcionado.'});
        }

        const deleted = await db.ParentAssignments.destroy({where: {id}});

        if (deleted === 0) {
            return res.status(404).json({message: 'Apoderado no encontrado.'});
        }

        res.status(200).json({message: 'Apoderado eliminado correctamente.'});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getParentAssignmentByUser = async (req, res) => {
    try {
        const {userId} = req.params;

        const user = await db.Users.findByPk(userId);
        if (!user)
            return res.status(404).json({error: "Usuario no encontrado."});

        const person = await db.Persons.findByPk(user.personId);
        if (!person)
            return res.status(404).json({error: "Persona asociada no encontrada."});

        const parent = await db.ParentAssignments.findAll({
            where: {personId: person.id},
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
                    model: db.StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['id', 'names', 'lastNames', 'role']
                        }
                    ]
                }
            ],
            attributes: ['id', 'relationshipType', 'status', 'createdAt', 'updatedAt']
        });
        if (!parent)
            return res.status(404).json({error: "No se encontraron los datos del padre de familia."});

        res.status(200).json(parent);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}
