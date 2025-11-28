const db = require('../models');

exports.createSection = async (req, res) => {
    try {

        const {seccion} = req.body;

        if (!seccion)
            res.status(400).error('No ha completado los campos requeridos');

        const newSection = await db.Sections.create({seccion});
        res.status(201).json(newSection);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.getSections = async (req, res) => {
    try {

        const sections = await db.Sections.findAll();
        res.json(sections);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.updateSection = async (req, res) => {
    const {id} = req.params;
    const {seccion} = req.body;

    try {

        const sections = await db.Sections.findByPk(id);

        if (!sections) {
            return res.status(404).json({message: 'Seccion no encontrado'});
        }

        sections.seccion = seccion;

        await sections.save();
        res.status(200).json(sections);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.deleteSection = async (req, res) => {
    try {
        const {id} = req.params;

        const deleted = await db.Sections.destroy({
            where: {id}
        });

        if (deleted) {
            res.status(200).json({message: 'Seccion eliminado correctamente'});
        } else {
            res.status(404).json({message: 'Seccion no encontrado'});
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}
