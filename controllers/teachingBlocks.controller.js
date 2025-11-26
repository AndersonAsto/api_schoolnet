const TeachingBlocks = require('../models/teachingBlocks.model');
const Years = require('../models/years.model');

exports.createTeachingBlock = async (req, res) => {
    try {
        const {
            yearId,
            teachingBlock,
            startDay,
            endDay
        } = req.body;

        if (!yearId || !teachingBlock || !startDay || !endDay)
            return res.status(400).json({message: 'Faltan datos obligatorios.'});

        const newTeachingBlock = await TeachingBlocks.create({
            yearId,
            teachingBlock,
            startDay,
            endDay
        });
        res.status(201).json(newTeachingBlock);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getTeachingBlocks = async (req, res) => {
    try {
        const teachingBlocks = await TeachingBlocks.findAll({
            include: {
                model: Years,
                as: 'years',
                attributes: ['id', 'year', 'status']
            }
        });
        res.status(200).json(teachingBlocks);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getBlocksByYear = async (req, res) => {
    try {
        const {yearId} = req.params;

        const blocks = await TeachingBlocks.findAll({
            where: {yearId}
        });
        res.status(200).json(blocks);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.updateTeachingBlock = async (req, res) => {
    const {id} = req.params;
    const {
        yearId,
        teachingBlock,
        startDay,
        endDay
    } = req.body;

    try {
        const teachingBlocks = await TeachingBlocks.findByPk(id);

        if (!teachingBlocks)
            return res.status(404).json({message: 'Bloque lectivo no encontrado.'});

        teachingBlocks.yearId = yearId;
        teachingBlocks.teachingBlock = teachingBlock;
        teachingBlocks.startDay = startDay;
        teachingBlocks.endDay = endDay;

        await teachingBlocks.save();
        res.status(200).json(teachingBlocks);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.deteleTeachingBlockById = async (req, res) => {
    try {
        const {id} = req.params;
        const deleted = await TeachingBlocks.destroy({where: {id}});

        if (deleted)
            res.status(200).json({message: 'Bloque lectivo eliminado correctamente.'});
        else
            res.status(404).json({message: 'Bloque lectivo no encontrado.'});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}
