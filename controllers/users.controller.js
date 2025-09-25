const Persons = require('../models/persons.model');
const Users = require('../models/users.model');

exports.createUser = async (req, res) => {
    try {

        const { 
            personId, 
            userName, 
            passwordHash, 
            role, 
            chargeDetail 
        } = req.body;

        if (!personId || !userName || !passwordHash || !role)
            return res.status(400).json({ error: 'No ha completado algunos campos' });            

        const newUser = await Users.create({ 
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
        console.error(error);
        res.status(500).json({ message: 'Error al crear usuario', error });
    }
}

exports.getUsers = async (req, res) => {
    try {

        const users = await Users.findAll({
            include: {
                model: Persons,
                as: 'persons',
                attributes: ['id', 'names', 'lastNames']
            },
            attributes: ['id', 'userName', 'passwordHash', 'role', 'status', 'createdAt', 'updatedAt']
        });
        res.status(200).json(users);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener usuarios", error });
    }
};

exports.getUsersByRole = async (req, res) => {
    try {

        const { role } = req.params;

        const validRoles = ['Administrador','Docente','Apoderado'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Rol inválido' });
        }

        const persons = await Users.findAll({
            where: { role },
            include: {
                model: Persons,
                as: 'persons',
                attributes: ['id', 'names', 'lastNames']
            },
            attributes: ['id', 'userName', 'passwordHash', 'role', 'status', 'createdAt', 'updatedAt']
        });
        res.json(persons);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al cargar usaurios según ', error
        })
    }
}

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { personId, userName, role, chargeDetail } = req.body;

    try {

        const users = await Users.findByPk(id);

        if (!users)
            return res.status(404).json({ message: 'Usuario no encontrado' });

        users.personId = personId;
        users.userName = userName;
        users.role = role;
        users.chargeDetail = chargeDetail;
        await users.save();

        const userResponse = users.toJSON();
        delete userResponse.passwordHash;
        res.status(200).json(userResponse);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error al actualizar usuario', error });
    }
}

exports.deleteStudentById = async (req, res) => {
    try {

        const { id } = req.params;
        const deleted = await Users.destroy({where: {id}});

        if (deleted) {
            res.status(200).json({ message: 'Usuario eliminado correctamente' });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar usuario', error });
    }
}