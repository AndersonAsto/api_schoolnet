const AnnualAverage = require('../models/annualAverage.model');
const OverallCourseAverage = require('../models/overallCourseAverage.model');
const TeacherGroups = require('../models/teacherGroups.model');
const StudentsEnrollments = require('../models/studentEnrollments.model');
const Years = require('../models/years.model');
const Courses = require('../models/courses.model');
const Grades = require('../models/grades.model');
const Sections = require('../models/sections.model');
const Persons = require('../models/persons.model');
const {Op} = require('sequelize');

exports.calculateAndSaveAnnualAverage = async (req, res) => {
    try {
        const {studentId, yearId} = req.body;

        if (!studentId || !yearId) {
            return res.status(400).json({
                status: false,
                message: "Faltan parámetros requeridos: studentId o yearId."
            });
        }

        // 🔹 Obtener todos los promedios por curso del estudiante en ese año
        const courseAverages = await OverallCourseAverage.findAll({
            where: {studentId, yearId},
            include: [
                {
                    model: TeacherGroups,
                    as: 'teachergroups',
                    attributes: ['courseId'],
                    include: [
                        {model: Courses, as: 'courses', attributes: ['course']}
                    ]
                }
            ]
        });

        if (!courseAverages.length) {
            return res.status(404).json({
                status: false,
                message: "No se encontraron promedios generales para el estudiante en el año indicado."
            });
        }

        // 🔹 Validar que existan 10 cursos distintos
        const uniqueCourses = new Set(courseAverages.map(avg => avg.teachergroups?.courseId));
        if (uniqueCourses.size < 10) {
            return res.status(400).json({
                status: false,
                message: `El estudiante tiene solo ${uniqueCourses.size} cursos registrados. Debe tener 10 para calcular el promedio anual.`
            });
        }

        // 🔹 Calcular el promedio general del año (suma de courseAverage / cantidad de cursos)
        const validAverages = courseAverages
            .map(a => parseFloat(a.courseAverage))
            .filter(v => !isNaN(v));

        const totalAverage = validAverages.reduce((acc, val) => acc + val, 0) / validAverages.length;
        const finalAverage = totalAverage.toFixed(2);

        // 🔹 Verificar si ya existe un registro anual
        const existing = await AnnualAverage.findOne({
            where: {studentId, yearId}
        });

        if (existing) {
            existing.average = finalAverage;
            await existing.save();

            return res.status(200).json({
                status: true,
                message: "✅ Promedio anual actualizado correctamente.",
                data: existing
            });
        }

        // 🔹 Crear nuevo registro
        const newRecord = await AnnualAverage.create({
            studentId,
            yearId,
            average: finalAverage
        });

        res.status(201).json({
            status: true,
            message: "✅ Promedio anual calculado y guardado correctamente.",
            data: newRecord
        });

    } catch (error) {
        console.error("❌ Error al calcular promedio anual:", error);
        res.status(500).json({
            status: false,
            message: "Error interno al calcular promedio anual.",
            error: error.message
        });
    }
};
