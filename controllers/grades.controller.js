const Grades = require('../models/grades.model');

exports.createGrade = async (req, res) => {
    try {

        const {grade} = req.body;

        if (!grade)
            return res.status(400).json({error: 'No ha completado los campos requeridos.'});

        const newGrade = await Grades.create({grade});
        res.status(201).json(newGrade);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al crear grado', error});
    }
}

exports.getGrades = async (req, res) => {
    try {

        const grades = await Grades.findAll();
        res.json(grades);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al obtener grados', error});
    }
}

exports.updateGrade = async (req, res) => {
    const {id} = req.params;
    const {grade} = req.body;

    try {

        const grades = await Grades.findByPk(id);

        if (!grades) {
            return res.status(404).json({message: 'Grado no encontrado'});
        }

        grades.grade = grade;
        await grades.save();

        res.status(200).json(grades);

    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Error al actualizar grado', error})
    }
}

exports.deleteGradeById = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({message: 'ID inválido o no proporcionado'});
        }

        const deleted = await Grades.destroy({where: {id}});

        if (deleted === 0) {
            return res.status(404).json({message: 'Grado no encontrado'});
        }

        res.status(200).json({message: 'Grado eliminado correctamente'});

    } catch (error) {
        console.error('❌ Error al eliminar grado:', error.message);

        // Detectar error de clave foránea (MySQL: ER_ROW_IS_REFERENCED_2)
        if (error.name === 'SequelizeForeignKeyConstraintError' ||
            error.parent?.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                message: 'No se puede eliminar el grado porque está asociado a otros registros (conflicto de integridad).'
            });
        }

        res.status(500).json({
            message: 'Error al eliminar grado',
            error: error.message
        });
    }
};