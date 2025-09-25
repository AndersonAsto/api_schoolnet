const Sections = require('../models/sections.model');

exports.createSection = async (req, res) => {
    try {

        const { seccion } = req.body;

        if (!seccion)
            res.status(400).error('No ha completado los campos requeridos');

        const newSection = await Sections.create({ seccion });
        res.status(201).json(newSection);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear seccion', error });
    }
}

exports.getSections = async (req, res) => {
    try {

        const sections = await Sections.findAll();
        res.json(sections);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener seccion', error });
    }
}

exports.updateSection =  async (req, res) => {
    const { id } = req.params;
    const { seccion } = req.body;

    try {
      
        const sections = await Sections.findByPk(id);

        if (!sections) {
            return res.status(404).json({ message: 'Seccion no encontrado' });
        }

        sections.seccion = seccion;
        
        await sections.save();
        res.status(200).json(sections);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar seccion', error });
    }
}

exports.deleteSectionById = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Sections.destroy({
            where: {id}
        });

        if (deleted) {
            res.status(200).json({ message: 'Seccion eliminado correctamente' });
        } else {
            res.status(404).json({ message: 'Seccion no encontrado' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar seccion', error });
    }
}