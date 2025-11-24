const Years = require('../models/years.model');

exports.createYear = async (req, res) => {
    try {
        const {year} = req.body;

        if (!year)
            return res.status(400).json({error: 'No ha completado los campos requeridos.'});

        const newYear = await Years.create({year});
        res.status(201).json(newYear);

    } catch (error) {
        console.error('Error de creación: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getYears = async (req, res) => {
    try {

        const years = await Years.findAll({
            order: [
                ['year', 'ASC']
            ]
        });
        res.json(years);

    } catch (error) {
        console.error('Error de obtención de datos: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.updateYear = async (req, res) => {
    const {id} = req.params;
    const {year} = req.body;
    try {
        const years = await Years.findByPk(id);
        if (!years)
            return res.status(404).json({message: 'Año no encontrado.'});
        years.year = year;
        await years.save();
        res.status(200).json(years);
    } catch (error) {
        console.error('Error de actualización: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.deleteYear = async (req, res) => {
    try {
        const {id} = req.params;
        const deleted = await Years.destroy({where: {id}});
        if (deleted)
            res.status(200).json({message: 'Año eliminado correctamente.'});
        else
            res.status(404).json({message: 'Año no encontrado.'});
    } catch (error) {
        console.error('Error de eliminación: ', error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}
