const db = require('../models');

exports.createUser = async (req, res) => {
    try {
        const {personId, userName, passwordHash, role, chargeDetail} = req.body;

        if (!personId || !userName || !passwordHash || !role)
            return res.status(400).json({error: 'No ha completado los campos requeridos.'});

        const newUser = await db.Users.create({
            personId,
            userName,
            passwordHash,
            role,
            chargeDetail
        });
        const userResponse = newUser.toJSON();
        delete userResponse.passwordHash;

        res.status(201).json(userResponse);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getUsers = async (req, res) => {
    try {
        const users = await db.Users.findAll({
            include: {
                model: db.Persons,
                as: 'persons',
                attributes: ['id', 'names', 'lastNames']
            },
            attributes: ['id', 'userName', 'passwordHash', 'role', 'chargeDetail', 'status', 'createdAt', 'updatedAt']
        });
        res.status(200).json(users);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getUsersByRole = async (req, res) => {
    try {
        const {role} = req.params;
        const validRoles = ['Administrador', 'Docente', 'Apoderado'];
        if (!validRoles.includes(role))
            return res.status(400).json({message: 'Rol inválido.'});

        const persons = await db.Users.findAll({
            where: {role},
            include: {
                model: db.Persons,
                as: 'persons',
                attributes: ['id', 'names', 'lastNames']
            },
            attributes: ['id', 'userName', 'passwordHash', 'role', 'chargeDetail', 'status', 'createdAt', 'updatedAt']
        });
        res.status(200).json(persons);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.updateUser = async (req, res) => {
    const {id} = req.params;
    const {personId, userName, role, chargeDetail} = req.body;

    try {
        const users = await db.Users.findByPk(id);

        if (!users)
            return res.status(404).json({message: 'Usuario no encontrado.'});

        users.personId = personId;
        users.userName = userName;
        users.role = role;
        users.chargeDetail = chargeDetail;
        await users.save();

        const userResponse = users.toJSON();
        delete userResponse.passwordHash;

        res.status(200).json(userResponse);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.deleteStudent = async (req, res) => {
    try {
        const {id} = req.params;
        const deleted = await db.Users.destroy({where: {id}});

        if (deleted)
            res.status(200).json({message: 'Usuario eliminado correctamente.'});
        else
            res.status(404).json({message: 'Usuario no encontrado.'});

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};
