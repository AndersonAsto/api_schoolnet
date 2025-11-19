const Holidays = require('../models/holidays.model');
const Years = require('../models/years.model');

exports.createHoliday = async (req, res) => {
    try {

        const {yearId, holiday} = req.body;

        if (!yearId || !holiday)
            return res.status(400).json({message: 'No ha completado los campos requeridos.'});

        const newHoliday = await Holidays.create({
            yearId, holiday
        });
        res.status(201).json(newHoliday);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getHolidays = async (req, res) => {
    try {

        const holidays = await Holidays.findAll({
            include: {
                model: Years,
                as: 'years',
                attributes: ['id', 'year', 'status']
            }
        });
        res.status(200).json(holidays);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al obtener días feriados', error});
    }
}

exports.getHolidaysByYear = async (req, res) => {
    try {

        const {yearId} = req.params;
        const holidays = await Holidays.findAll({
            where: {yearId}
        });
        res.status(200).json(holidays);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al obtener días feriados'});
    }
};

exports.deleteHolydayById = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({message: 'Identificador inválido o no proporcionado.'});
        }

        const deleted = await Holidays.destroy({where: {id}});

        if (deleted === 0) {
            return res.status(404).json({message: 'Día feriado no encontrada.'});
        }

        res.status(200).json({message: 'Día feriado eliminado correctamente.'});
    } catch (error) {
        console.error('Error al eliminar día feriado: ', error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.updateHolyday = async (req, res) => {
    const {id} = req.params;
    const {yearId, holiday} = req.body;
    try {
        const holy_days = await Holidays.findByPk(id);

        if (!holy_days) {
            return res.status(404).json({message: 'Incidente no encontrado.'});
        }

        holy_days.yearId = yearId;
        holy_days.holiday = holiday;
        await holy_days.save();

        res.status(200).json(holy_days);
    } catch (error) {
        console.error('Error al actualizar día feriado: ', error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}