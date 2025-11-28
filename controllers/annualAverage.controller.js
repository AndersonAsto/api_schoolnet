const {Op} = require('sequelize');
const db = require('../models');

exports.calculateAnnualAverage = async (req, res) => {
    try {
        const {studentId, yearId} = req.body;

        if (!studentId || !yearId) {
            return res.status(400).json({
                status: false,
                message: "Faltan parámetros requeridos: studentId o yearId."
            });
        }

        // Obtener todos los promedios por curso del estudiante en ese año
        const courseAverages = await db.OverallCourseAverage.findAll({
            where: {studentId, yearId},
            include: [
                {
                    model: db.TeacherGroups,
                    as: 'teachergroups',
                    attributes: ['courseId'],
                    include: [
                        {model: db.Courses, as: 'courses', attributes: ['course']}
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

        // Validar que existan 10 cursos distintos
        const uniqueCourses = new Set(courseAverages.map(avg => avg.teachergroups?.courseId));
        if (uniqueCourses.size < 10) {
            return res.status(400).json({
                status: false,
                message: `El estudiante tiene solo ${uniqueCourses.size} cursos registrados. Debe tener 10 para calcular el promedio anual.`
            });
        }

        // Calcular el promedio general del año (suma de courseAverage / cantidad de cursos)
        const validAverages = courseAverages
            .map(a => parseFloat(a.courseAverage))
            .filter(v => !isNaN(v));

        const totalAverage = validAverages.reduce((acc, val) => acc + val, 0) / validAverages.length;
        const finalAverage = totalAverage.toFixed(2);

        // Verificar si ya existe un registro anual
        const existing = await db.AnnualAverage.findOne({
            where: {studentId, yearId}
        });

        if (existing) {
            existing.average = finalAverage;
            await existing.save();

            return res.status(200).json({
                status: true,
                message: "Promedio anual actualizado correctamente.",
                data: existing
            });
        }

        // Crear nuevo registro
        const newRecord = await db.AnnualAverage.create({
            studentId,
            yearId,
            average: finalAverage
        });

        res.status(201).json({
            status: true,
            message: "Promedio anual calculado y guardado correctamente.",
            data: newRecord
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getAnnualAverageByYearAndTutor = async (req, res) => {
    try {
        const {yearId, tutorId} = req.params;

        if (!yearId) {
            return res
                .status(400)
                .json({message: "El identificador del año es requerido."});
        }

        if (!tutorId) {
            return res
                .status(400)
                .json({message: "El identificador del tutor es requerido."});
        }

        // 1. Buscar el grupo de tutor
        const group = await db.Tutors.findByPk(tutorId);

        if (!group) {
            return res
                .status(404)
                .json({message: "Grupo de tutor no encontrado."});
        }

        // 2. Buscar todas las matrículas (StudentEnrollments) de ese año, grado y sección
        const enrollments = await db.StudentEnrollments.findAll({
            where: {
                yearId: yearId,
                gradeId: group.gradeId,
                sectionId: group.sectionId,
                status: true,
            },
            include: [
                {
                    model: db.Persons,
                    as: 'persons',
                    attributes: ['names', 'lastNames']
                },
                {
                    model: db.Grades,
                    as: 'grades',
                    attributes: ['grade']
                },
                {
                    model: db.Sections,
                    as: 'sections',
                    attributes: ['seccion']
                },
                {
                    model: db.Years,
                    as: 'years',
                    attributes: ['year']
                }
            ]
        });

        if (!enrollments.length) {
            return res.status(200).json({
                status: true,
                message: 'No hay estudiantes matriculados para este año y grupo.',
                data: []
            });
        }

        const enrollmentIds = enrollments.map(e => e.id);

        // 3. Buscar los AnnualAverage para esos students (studentId = enrollment.id)
        const annualAverages = await db.AnnualAverage.findAll({
            where: {
                yearId: yearId,
                studentId: {
                    [Op.in]: enrollmentIds
                },
                status: true
            },
            include: [
                {
                    model: db.StudentEnrollments,
                    as: 'students',
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['names', 'lastNames']
                        },
                        {
                            model: db.Grades,
                            as: 'grades',
                            attributes: ['grade']
                        },
                        {
                            model: db.Sections,
                            as: 'sections',
                            attributes: ['seccion']
                        },
                        {
                            model: db.Years,
                            as: 'years',
                            attributes: ['year']
                        }
                    ]
                },
                {
                    model: db.Years,
                    as: 'years',
                    attributes: ['year']
                }
            ],
            order: [
                [
                    {model: db.StudentEnrollments, as: 'students'},
                    {model: db.Persons, as: 'persons'},
                    'lastNames',
                    'ASC'
                ]
            ]
        });

        return res.status(200).json({
            status: true,
            message: 'Promedios anuales por año y grupo encontrados.',
            data: annualAverages
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getAnnualAverageByYearAndStudent = async (req, res) => {
    try {
        const {yearId, studentId} = req.params;

        if (!yearId || !studentId) {
            return res.status(400).json({
                status: false,
                message: 'El año y el estudiante son requeridos.'
            });
        }

        const annualAverage = await db.AnnualAverage.findOne({
            where: {
                yearId,
                studentId,
                status: true
            },
            include: [
                {
                    model: db.StudentEnrollments,
                    as: 'students',
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['names', 'lastNames']
                        },
                        {
                            model: db.Grades,
                            as: 'grades',
                            attributes: ['grade']
                        },
                        {
                            model: db.Sections,
                            as: 'sections',
                            attributes: ['seccion']
                        },
                        {
                            model: db.Years,
                            as: 'years',
                            attributes: ['year']
                        }
                    ]
                },
                {
                    model: db.Years,
                    as: 'years',
                    attributes: ['year']
                }
            ],
            order: [
                [
                    {model: db.StudentEnrollments, as: 'students'},
                    {model: db.Persons, as: 'persons'},
                    'lastNames',
                    'ASC'
                ]
            ]
        });

        if (!annualAverage) {
            return res.status(404).json({
                status: false,
                message: 'No se encontró promedio anual para este estudiante en ese año.'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Promedio anual encontrado.',
            data: annualAverage
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getAnnualAverageByYearAndStudents = async (req, res) => {
    try {
        const {yearId, studentIds} = req.body;

        if (!yearId || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                status: false,
                message: 'El año y la lista de estudiantes son requeridos.',
            });
        }

        const annualAverages = await db.AnnualAverage.findAll({
            where: {
                yearId,
                studentId: studentIds,
                status: true,
            },
            include: [
                {
                    model: db.StudentEnrollments,
                    as: 'students',
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['names', 'lastNames'],
                        },
                        {
                            model: db.Grades,
                            as: 'grades',
                            attributes: ['grade'],
                        },
                        {
                            model: db.Sections,
                            as: 'sections',
                            attributes: ['seccion'],
                        },
                        {
                            model: db.Years,
                            as: 'years',
                            attributes: ['year'],
                        },
                    ],
                },
                {
                    model: db.Years,
                    as: 'years',
                    attributes: ['year'],
                },
            ],
            order: [
                [
                    {model: db.StudentEnrollments, as: 'students'},
                    {model: db.Persons, as: 'persons'},
                    'lastNames',
                    'ASC',
                ],
            ],
        });

        if (!annualAverages || annualAverages.length === 0) {
            return res.status(404).json({
                status: false,
                message:
                    'No se encontraron promedios anuales para los estudiantes en ese año.',
                data: [],
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Promedios anuales encontrados.',
            data: annualAverages,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};
