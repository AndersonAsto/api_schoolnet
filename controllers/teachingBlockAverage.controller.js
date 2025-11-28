const db = require('../models');

exports.previewTeachingBlockAverage = async (req, res) => {
    try {
        const {studentId, assignmentId, teachingBlockId} = req.body;

        if (!studentId || !assignmentId || !teachingBlockId) {
            return res.status(400).json({message: 'Faltan parámetros obligatorios (studentId, assignmentId, teachingBlockId)'});
        }

        const group = await db.TeacherGroups.findByPk(assignmentId);
        if (!group) {
            return res.status(404).json({message: 'TeacherGroup no encontrado'});
        }

        const {gradeId, sectionId, courseId} = group;

        // Calcular como antes
        const qualifications = await db.Qualifications.findAll({
            include: [
                {
                    model: db.Schedules,
                    as: 'schedules',
                    where: {gradeId, sectionId, courseId},
                    attributes: [],
                },
            ],
            where: {studentId, teachingBlockId, status: true},
            attributes: ['rating'],
        });

        const dailyAvarage = qualifications.length
            ? qualifications.reduce((sum, q) => sum + parseFloat(q.rating || 0), 0) / qualifications.length
            : 0;

        const practices = await db.Evaluations.findAll({
            where: {studentId, assigmentId: assignmentId, teachingBlockId, type: 'Práctica', status: true},
            attributes: ['score'],
        });

        const practiceAvarage = practices.length
            ? practices.reduce((sum, e) => sum + parseFloat(e.score || 0), 0) / practices.length
            : 0;

        const exams = await db.Evaluations.findAll({
            where: {studentId, assigmentId: assignmentId, teachingBlockId, type: 'Examen', status: true},
            attributes: ['score'],
        });

        const examAvarage = exams.length
            ? exams.reduce((sum, e) => sum + parseFloat(e.score || 0), 0) / exams.length
            : 0;

        const teachingBlockAvarage = (dailyAvarage * 0.3 + practiceAvarage * 0.3 + examAvarage * 0.4).toFixed(2);

        // Solo devolver, sin guardar
        return res.status(200).json({
            message: 'Vista previa generada correctamente',
            data: {dailyAvarage, practiceAvarage, examAvarage, teachingBlockAvarage},
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.calculateTeachingBlockAverage = async (req, res) => {
    try {
        const {studentId, assignmentId, teachingBlockId} = req.body;

        if (!studentId || !assignmentId || !teachingBlockId) {
            return res.status(400).json({message: 'Faltan parámetros obligatorios'});
        }

        const group = await db.TeacherGroups.findByPk(assignmentId);
        if (!group) {
            return res.status(404).json({message: 'TeacherGroup no encontrado'});
        }

        const {gradeId, sectionId, courseId} = group;

        const qualifications = await db.Qualifications.findAll({
            include: [{model: db.Schedules, as: 'schedules', where: {gradeId, sectionId, courseId}, attributes: []}],
            where: {studentId, teachingBlockId, status: true},
            attributes: ['rating'],
        });

        const dailyAvarage = qualifications.length
            ? qualifications.reduce((sum, q) => sum + parseFloat(q.rating || 0), 0) / qualifications.length
            : 0;

        const practices = await db.Evaluations.findAll({
            where: {studentId, assigmentId: assignmentId, teachingBlockId, type: 'Práctica', status: true},
            attributes: ['score'],
        });

        const practiceAvarage = practices.length
            ? practices.reduce((sum, e) => sum + parseFloat(e.score || 0), 0) / practices.length
            : 0;

        const exams = await db.Evaluations.findAll({
            where: {studentId, assigmentId: assignmentId, teachingBlockId, type: 'Examen', status: true},
            attributes: ['score'],
        });

        const examAvarage = exams.length
            ? exams.reduce((sum, e) => sum + parseFloat(e.score || 0), 0) / exams.length
            : 0;

        const teachingBlockAvarage = (dailyAvarage * 0.3 + practiceAvarage * 0.3 + examAvarage * 0.4).toFixed(2);

        // Buscar si ya existe registro
        const existing = await db.TeachingBlockAverage.findOne({
            where: {studentId, assignmentId, teachingBlockId},
        });

        if (existing) {
            await existing.update({
                dailyAvarage,
                practiceAvarage,
                examAvarage,
                teachingBlockAvarage,
                updatedAt: new Date(),
            });
        } else {
            await db.TeachingBlockAverage.create({
                studentId,
                assignmentId,
                teachingBlockId,
                dailyAvarage,
                practiceAvarage,
                examAvarage,
                teachingBlockAvarage,
                status: true,
                createdAt: new Date(),
            });
        }

        return res.status(200).json({
            message: existing ? 'Promedio actualizado correctamente' : 'Promedio creado correctamente',
            data: {dailyAvarage, practiceAvarage, examAvarage, teachingBlockAvarage},
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getTeachingBlockAverageByStudent = async (req, res) => {
    try {
        const {studentId} = req.params;

        const averages = await db.TeachingBlockAverage.findAll({
            where: {studentId},
            include: [
                {
                    model: db.TeachingBlocks,
                    as: "teachingblocks",
                    attributes: ["id", "teachingBlock", "startDay", "endDay"],
                },
                {
                    model: db.TeacherGroups,
                    as: "teachergroups",
                    attributes: ["id"],
                    include: [
                        {model: db.Courses, as: "courses", attributes: ["id", "course"]},
                        {model: db.Grades, as: "grades", attributes: ["id", "grade"]},
                        {model: db.Sections, as: "sections", attributes: ["id", "seccion"]},
                        {model: db.Years, as: "years", attributes: ["id", "year"]}
                    ],
                },
                {
                    model: db.StudentEnrollments,
                    as: "students",
                    attributes: ["id"],
                    include: [{model: db.Persons, as: "persons", attributes: ["id", "names", "lastNames"]}],
                },
            ],
            order: [["teachingBlockId", "ASC"]],
        });

        if (!averages.length) {
            return res.status(404).json({message: "No se encontraron promedios de bloque lectivo para este estudiante."});
        }

        res.status(200).json(averages);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getTeachingBlockAverageByGroup = async (req, res) => {
    try {
        const {assignmentId} = req.params;

        const averages = await db.TeachingBlockAverage.findAll({
            where: {assignmentId},
            include: [
                {
                    model: db.TeachingBlocks,
                    as: "teachingblocks",
                    attributes: ["id", "teachingBlock", "startDay", "endDay"],
                },
                {
                    model: db.StudentEnrollments,
                    as: "students",
                    attributes: ["id"],
                    include: [{model: db.Persons, as: "persons", attributes: ["names", "lastNames"]}],
                },
            ],
            order: [
                ["teachingBlockId", "ASC"],
                [{model: db.StudentEnrollments, as: "students"}, "id", "ASC"],
            ],
        });

        if (!averages.length)
            return res.status(404).json({message: "No se encontraron promedios de bloque lectivo para este grupo docente."});

        res.status(200).json(averages);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getTeachingBlockAverageByBlock = async (req, res) => {
    try {
        const {teachingBlockId} = req.params;

        const averages = await db.TeachingBlockAverage.findAll({
            where: {teachingBlockId},
            include: [
                {
                    model: db.StudentEnrollments,
                    as: "students",
                    attributes: ["id"],
                    include: [{model: db.Persons, as: "persons", attributes: ["names", "lastNames"]}],
                },
                {
                    model: db.TeacherGroups,
                    as: "teachergroups",
                    attributes: ["id"],
                    include: [
                        {model: db.Courses, as: "courses", attributes: ["course"]},
                        {model: db.Grades, as: "grades", attributes: ["grade"]},
                        {model: db.Sections, as: "sections", attributes: ["seccion"]},
                        {model: db.Years, as: "years", attributes: ["year"]}
                    ],
                },
            ],
            order: [["assignmentId", "ASC"]],
        });

        if (!averages.length) {
            return res.status(404).json({message: "No se encontraron promedios para este bloque lectivo."});
        }

        res.status(200).json(averages);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};

exports.getTeachingBlockAverageByYearGroupAndStudent = async (req, res) => {
    try {
        const {studentId, yearId, assignmentId} = req.params;

        if (!studentId || !yearId || !assignmentId) {
            return res.status(400).json({message: "Faltan parámetros: studentId, yearId o assignmentId"});
        }

        const averages = await db.TeachingBlockAverage.findAll({
            where: {studentId, assignmentId},
            include: [
                {
                    model: db.TeachingBlocks,
                    as: "teachingblocks",
                    attributes: ["id", "teachingBlock", "startDay", "endDay"],
                    where: {yearId},
                },
                {
                    model: db.TeacherGroups,
                    as: "teachergroups",
                    include: [
                        {model: db.Courses, as: "courses", attributes: ["id", "course"]},
                        {model: db.Grades, as: "grades", attributes: ["id", "grade"]},
                        {model: db.Sections, as: "sections", attributes: ["id", "seccion"]},
                        {model: db.Years, as: "years", attributes: ["id", "year"]},
                    ],
                },
                {
                    model: db.StudentEnrollments,
                    as: "students",
                    attributes: ["id"],
                    include: [{model: db.Persons, as: "persons", attributes: ["id", "names", "lastNames"]}],
                },
            ],
            order: [["teachingBlockId", "ASC"]],
        });

        if (!averages.length) {
            return res.status(404).json({
                message: "No se encontraron promedios de bloque lectivo para este estudiante en el año y grupo docente especificado.",
            });
        }

        res.status(200).json(averages);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Error interno del servidor. Inténtelo de nuevo más tarde.'});
    }
};
