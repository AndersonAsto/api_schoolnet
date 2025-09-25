const Holidays = require('../models/holidays.model');
const Years = require('../models/years.model');

exports.createHoliday = async (req, res) => {
    try {

        const { yearId, holiday } = req.body;
        
        if (!yearId || !holiday)
            return res.status(400).json({ message: 'No ha completado los campos requeridos.' });

        const newHoliday = await Holidays.create({
            yearId, holiday
        });
        res.status(201).json(newHoliday);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear día feriado', error });
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
        res.status(500).json({ message: 'Error al obtener días feriados', error });
    }
}

exports.getHolidaysByYear = async (req, res) => {
    try {

        const { yearId } = req.params;
        const holidays = await Holidays.findAll({ 
            where: { yearId }
        });
        res.status(200).json(holidays);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener días feriados' });
    }
};