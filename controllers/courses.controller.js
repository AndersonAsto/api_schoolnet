const db = require('../models');

exports.createCourse = async (req, res) => {
    try {

        const {course, recurrence} = req.body;

        if (!course)
            return res.status(400).json({error: 'No ha completado los campos requeridos.'});

        const newCourse = await db.Courses.create({course, recurrence});
        res.status(201).json(newCourse);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al crear curso', error});
    }
}

exports.getCourses = async (req, res) => {
    try {

        const courses = await db.Courses.findAll();
        res.json(courses);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.updateCourse = async (req, res) => {
    const {id} = req.params;
    const {course, recurrence} = req.body;

    try {

        const courses = await db.Courses.findByPk(id);

        if (!courses)
            return res.status(404).json({message: 'Curso no encontrado'});

        courses.course = course;
        courses.recurrence = recurrence;

        await courses.save();
        res.status(200).json(courses);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
}

exports.deleteCourse = async (req, res) => {
    try {
        const {id} = req.params;
        const deleted = await db.Courses.destroy({where: {id}});

        if (deleted) {
            return res.status(200).json({message: 'Curso eliminado correctamente'});
        } else {
            return res.status(404).json({message: 'Curso no encontrado'});
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};
