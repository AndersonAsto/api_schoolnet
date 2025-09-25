const Courses = require('../models/courses.model');

exports.createCourse = async (req, res) =>  {
    try {

        const { course , descripcion } =  req.body;

        if (!course)
            return res.status(400).json({ error: 'No ha completado los campos requeridos.' });

        const newCourse = await Courses.create({ course, descripcion });
        res.status(201).json(newCourse);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear curso', error });
    }
}

exports.getCourses = async (req, res) => {
    try {

        const courses = await Courses.findAll();
        res.json(courses);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cursos', error });
    }
}

exports.updateCourse = async (req, res) => {
    const { id } = req.params;
    const { course, descripcion } = req.body;

    try {

        const courses = await Courses.findByPk(id);

        if(!courses) 
            return res.status(404).json({ message: 'Curso no encontrado' });

        courses.course = course;
        courses.descripcion  = descripcion;

        await courses.save();
        res.status(200).json(courses);

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error al actualizar curso', error })
    }
}

exports.deleteCourseById = async (req, res) => {
    try {

        const { id } = req.params;
        const deleted = await Courses.destroy({ where: { id } });

        if (deleted) {
            res.status(200).json({ message: 'Curso eliminado correctamente' });
        } else {
            res.status(404).json({ message: 'Curso no encontrado' });
        }

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error al eliminar curso', error });
    }
}