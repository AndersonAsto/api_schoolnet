const db = require('../models');

exports.calculateOverallCourseAverage = async (req, res) => {
    try {
        const {studentId, assignmentId, yearId} = req.body;

        if (!studentId || !assignmentId || !yearId) {
            return res.status(400).json({
                message: "Faltan parámetros: studentId, scheduleId o yearId",
            });
        }

        // Traer los promedios por bloque lectivo existentes
        const blocks = await db.TeachingBlockAverage.findAll({
            where: {studentId, assignmentId},
            include: [
                {
                    model: db.TeachingBlocks,
                    as: "teachingblocks",
                    attributes: ["id", "teachingBlock", "startDay", "endDay", "yearId"],
                    where: {yearId}
                },
            ],
            order: [["teachingBlockId", "ASC"]],
        });

        if (!blocks.length) {
            return res.status(404).json({message: "No se encontraron promedios de bloques lectivos para este estudiante y año."});
        }
        // sonarjs/sonar-rule: S7773
        // eslint-disable-next-line sonarjs/prefer-number-isnan
        // Cargar los promedios por bloque según el orden
        const averages = [null, null, null, null];
        // sonarjs/sonar-rule: S7773
        // eslint-disable-next-line sonarjs/prefer-number-isnan
        blocks.forEach((b, i) => {
            averages[i] = parseFloat(b.teachingBlockAvarage);
        });

        // Calcular promedio anual considerando solo los bloques existentes
        const validAverages = averages.filter(v => v !== null && !isNaN(v));
        const courseAverage = validAverages.length
            ? (validAverages.reduce((a, b) => a + b, 0) / validAverages.length).toFixed(2)
            : null;

        if (courseAverage === null) {
            return res.status(400).json({message: "No se puede calcular el promedio anual (no hay bloques válidos)."});
        }

        // Crear o actualizar registro existente
        const [record, created] = await db.OverallCourseAverage.findOrCreate({
            where: {studentId, assignmentId, yearId},
            defaults: {
                block1Average: averages[0],
                block2Average: averages[1],
                block3Average: averages[2],
                block4Average: averages[3],
                courseAverage: courseAverage,
                status: true,
            },
        });

        if (!created) {
            // Si ya existe, actualizar los valores
            record.block1Average = averages[0];
            record.block2Average = averages[1];
            record.block3Average = averages[2];
            record.block4Average = averages[3];
            record.courseAverage = courseAverage;
            await record.save();
        }

        res.status(200).json({
            message: created ? "Promedio anual registrado correctamente." : "Promedio anual actualizado.",
            courseAverage: record,
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getOverallCourseAverageByYearAndStudent = async (req, res) => {
    try {
        const {studentId, yearId} = req.query;

        if (!studentId || !yearId) {
            return res.status(400).json({
                status: false,
                message: "Faltan parámetros requeridos: studentId, yearId o assignmentId."
            });
        }

        const records = await db.OverallCourseAverage.findAll({
            where: {studentId, yearId},
            include: [
                {
                    model: db.StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['names', 'lastNames']
                        }
                    ]
                },
                {
                    model: db.Years,
                    as: 'years',
                    attributes: ['year']
                },
                {
                    model: db.TeacherGroups,
                    as: 'teachergroups',
                    attributes: ['id', 'teacherAssignmentId', 'gradeId', 'sectionId', 'courseId'],
                    include: [
                        {
                            model: db.Courses,
                            as: 'courses',
                            attributes: ['course']
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
                        }
                    ]
                }
            ],
            order: [['id', 'ASC']]
        });

        if (!records.length) {
            return res.status(404).json({
                status: false,
                message: "No se encontraron promedios generales para los filtros seleccionados."
            });
        }

        res.status(200).json({
            status: true,
            message: "Promedios generales por cursos encontrados.",
            data: records
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getOverallCourseAverageByYearAndGroup = async (req, res) => {
    try {
        const {yearId, assignmentId} = req.query;

        if (!yearId || !assignmentId) {
            return res.status(400).json({
                status: false,
                message: "Faltan parámetros requeridos: studentId, yearId o assignmentId."
            });
        }

        const records = await db.OverallCourseAverage.findAll({
            where: {yearId, assignmentId},
            include: [
                {
                    model: db.StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['names', 'lastNames']
                        }
                    ]
                },
                {
                    model: db.Years,
                    as: 'years',
                    attributes: ['year']
                },
                {
                    model: db.TeacherGroups,
                    as: 'teachergroups',
                    attributes: ['id', 'teacherAssignmentId', 'gradeId', 'sectionId', 'courseId'],
                    include: [
                        {
                            model: db.Courses,
                            as: 'courses',
                            attributes: ['course']
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
                        }
                    ]
                }
            ],
            order: [['id', 'ASC']]
        });

        if (!records.length) {
            return res.status(404).json({
                status: false,
                message: "No se encontraron promedios generales para los filtros seleccionados."
            });
        }

        res.status(200).json({
            status: true,
            message: "Promedios generales por cursos encontrados.",
            data: records
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getOverallCourseAverageByYearGroupAndStudent = async (req, res) => {
    try {
        const {studentId, yearId, assignmentId} = req.query;

        if (!studentId || !yearId || !assignmentId) {
            return res.status(400).json({
                status: false,
                message: "Faltan parámetros requeridos (estudiante, año o asignación)."
            });
        }

        const records = await db.OverallCourseAverage.findAll({
            where: {studentId, yearId, assignmentId},
            include: [
                {
                    model: db.StudentEnrollments,
                    as: 'students',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Persons,
                            as: 'persons',
                            attributes: ['names', 'lastNames']
                        }
                    ]
                },
                {
                    model: db.Years,
                    as: 'years',
                    attributes: ['year']
                },
                {
                    model: db.TeacherGroups,
                    as: 'teachergroups',
                    attributes: ['id', 'teacherAssignmentId', 'gradeId', 'sectionId', 'courseId'],
                    include: [
                        {
                            model: db.Courses,
                            as: 'courses',
                            attributes: ['course']
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
                        }
                    ]
                }
            ],
            order: [['id', 'ASC']]
        });

        if (!records.length) {
            return res.status(404).json({
                status: false,
                message: "No se encontraron promedios generales para los filtros seleccionados."
            });
        }

        res.status(200).json({
            status: true,
            message: "Promedios generales por cursos encontrados.",
            data: records
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};
