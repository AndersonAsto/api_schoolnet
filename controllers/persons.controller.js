const Persons = require('../models/persons.model');

exports.createPerson = async (req, res) => {
    try {

        const {
            names,
            lastNames,
            dni,
            email,
            phone,
            role
        } = req.body;

        if (!names || !lastNames || !dni || !email || !phone || !role)
            return res.status(400).json({error: 'No ha completado todos los campos'});

        const newPerson = await Persons.create({
            names,
            lastNames,
            dni,
            email,
            phone,
            role
        });
        res.status(201).json(newPerson);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al crear persona', error});
    }
}

exports.getPersons = async (req, res) => {
    try {

        const persons = await Persons.findAll();
        res.json(persons);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al obtener personas', error});
    }
}

exports.updatePerson = async (req, res) => {
    const {id} = req.params;
    const {names, lastNames, dni, email, phone, role} = req.body;

    try {
        const persons = await Persons.findByPk(id);

        if (!persons) {
            return res.status(404).json({message: 'Persona no encontrada'});
        }

        persons.names = names;
        persons.lastNames = lastNames;
        persons.dni = dni;
        persons.email = email;
        persons.phone = phone;
        persons.role = role;

        await persons.save();

        res.status(200).json(persons);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al actualizar persona', error});
    }
}

exports.deletePersonById = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({message: 'ID inválido o no proporcionado'});
        }

        const deleted = await Persons.destroy({where: {id}});

        if (deleted === 0) {
            return res.status(404).json({message: 'Persona no encontrada'});
        }

        res.status(200).json({message: 'Persona eliminada correctamente'});

    } catch (error) {
        console.error('❌ Error al eliminar persona:', error.message);

        if (error.name === 'SequelizeForeignKeyConstraintError' ||
            error.parent?.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                message: 'No se puede eliminar la persona porque está asociada a otros registros (conflicto de integridad).'
            });
        }

        res.status(500).json({
            message: 'Error al eliminar persona',
            error: error.message
        });
    }
};

exports.getPersonsByPrivilege = async (req, res) => {
    try {

        const validRoles = ['Administrador', 'Docente', 'Apoderado'];

        const persons = await Persons.findAll({
            where: {
                role: validRoles
            },
        });
        res.json(persons);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al obtener personas', error});
    }
}

exports.getPersonsByRole = async (req, res) => {
    try {

        const {role} = req.params;

        const validRoles = ['Administrador', 'Docente', 'Estudiante', 'Apoderado'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({message: 'Rol inválido'});
        }

        const persons = await Persons.findAll({
            where: {role}
        });
        res.json(persons);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al obtener personas por rol', error});
    }
};
