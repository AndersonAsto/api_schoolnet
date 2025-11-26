const {Op} = require("sequelize");
const TeachingBlockAvarage = require("../models/teachingBlockAverage.model");
const Exams = require("../models/evaluations.model");
const TeachingBlocks = require("../models/teachingBlocks.model");
const Schedules = require("../models/schedules.model");
const StudentsEnrollments = require("../models/studentEnrollments.model");
const Courses = require("../models/courses.model");
const Grades = require("../models/grades.model");
const Sections = require("../models/sections.model");
const Persons = require("../models/persons.model");
const Years = require("../models/years.model");
const Qualifications = require("../models/qualifications.model");
const TeacherGroups = require("../models/teacherGroups.model");

exports.previewTeachingBlockAverage = async (req, res) => {
    try {
        const {studentId, assignmentId, teachingBlockId} = req.body;

        if (!studentId || !assignmentId || !teachingBlockId) {
            return res.status(400).json({message: 'Faltan parámetros obligatorios (studentId, assignmentId, teachingBlockId)'});
        }

        const group = await TeacherGroups.findByPk(assignmentId);
        if (!group) {
            return res.status(404).json({message: 'TeacherGroup no encontrado'});
        }

        const {gradeId, sectionId, courseId} = group;

        // Calcular como antes
        const qualifications = await Qualifications.findAll({
            include: [
                {
                    model: Schedules,
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

        const practices = await Exams.findAll({
            where: {studentId, assigmentId: assignmentId, teachingBlockId, type: 'Práctica', status: true},
            attributes: ['score'],
        });

        const practiceAvarage = practices.length
            ? practices.reduce((sum, e) => sum + parseFloat(e.score || 0), 0) / practices.length
            : 0;

        const exams = await Exams.findAll({
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
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.calculateTeachingBlockAverage = async (req, res) => {
    try {
        const {studentId, assignmentId, teachingBlockId} = req.body;

        if (!studentId || !assignmentId || !teachingBlockId) {
            return res.status(400).json({message: 'Faltan parámetros obligatorios'});
        }

        const group = await TeacherGroups.findByPk(assignmentId);
        if (!group) {
            return res.status(404).json({message: 'TeacherGroup no encontrado'});
        }

        const {gradeId, sectionId, courseId} = group;

        const qualifications = await Qualifications.findAll({
            include: [{model: Schedules, as: 'schedules', where: {gradeId, sectionId, courseId}, attributes: []}],
            where: {studentId, teachingBlockId, status: true},
            attributes: ['rating'],
        });

        const dailyAvarage = qualifications.length
            ? qualifications.reduce((sum, q) => sum + parseFloat(q.rating || 0), 0) / qualifications.length
            : 0;

        const practices = await Exams.findAll({
            where: {studentId, assigmentId: assignmentId, teachingBlockId, type: 'Práctica', status: true},
            attributes: ['score'],
        });

        const practiceAvarage = practices.length
            ? practices.reduce((sum, e) => sum + parseFloat(e.score || 0), 0) / practices.length
            : 0;

        const exams = await Exams.findAll({
            where: {studentId, assigmentId: assignmentId, teachingBlockId, type: 'Examen', status: true},
            attributes: ['score'],
        });

        const examAvarage = exams.length
            ? exams.reduce((sum, e) => sum + parseFloat(e.score || 0), 0) / exams.length
            : 0;

        const teachingBlockAvarage = (dailyAvarage * 0.3 + practiceAvarage * 0.3 + examAvarage * 0.4).toFixed(2);

        // Buscar si ya existe registro
        const existing = await TeachingBlockAvarage.findOne({
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
            await TeachingBlockAvarage.create({
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
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.getTeachingBlockAverageByStudent = async (req, res) => {
    try {
        const {studentId} = req.params;

        const averages = await TeachingBlockAvarage.findAll({
            where: {studentId},
            include: [
                {
                    model: TeachingBlocks,
                    as: "teachingblocks",
                    attributes: ["id", "teachingBlock", "startDay", "endDay"],
                },
                {
                    model: TeacherGroups,
                    as: "teachergroups",
                    attributes: ["id"],
                    include: [
                        {model: Courses, as: "courses", attributes: ["id", "course"]},
                        {model: Grades, as: "grades", attributes: ["id", "grade"]},
                        {model: Sections, as: "sections", attributes: ["id", "seccion"]},
                        {model: Years, as: "years", attributes: ["id", "year"]}
                    ],
                },
                {
                    model: StudentsEnrollments,
                    as: "students",
                    attributes: ["id"],
                    include: [{model: Persons, as: "persons", attributes: ["id", "names", "lastNames"]}],
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
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.getTeachingBlockAverageByGroup = async (req, res) => {
    try {
        const {assignmentId} = req.params;

        const averages = await TeachingBlockAvarage.findAll({
            where: {assignmentId},
            include: [
                {
                    model: TeachingBlocks,
                    as: "teachingblocks",
                    attributes: ["id", "teachingBlock", "startDay", "endDay"],
                },
                {
                    model: StudentsEnrollments,
                    as: "students",
                    attributes: ["id"],
                    include: [{model: Persons, as: "persons", attributes: ["names", "lastNames"]}],
                },
            ],
            order: [
                ["teachingBlockId", "ASC"],
                [{model: StudentsEnrollments, as: "students"}, "id", "ASC"],
            ],
        });

        if (!averages.length)
            return res.status(404).json({message: "No se encontraron promedios de bloque lectivo para este grupo docente."});

        res.status(200).json(averages);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.getTeachingBlockAverageByBlock = async (req, res) => {
    try {
        const {teachingBlockId} = req.params;

        const averages = await TeachingBlockAvarage.findAll({
            where: {teachingBlockId},
            include: [
                {
                    model: StudentsEnrollments,
                    as: "students",
                    attributes: ["id"],
                    include: [{model: Persons, as: "persons", attributes: ["names", "lastNames"]}],
                },
                {
                    model: TeacherGroups,
                    as: "teachergroups",
                    attributes: ["id"],
                    include: [
                        {model: Courses, as: "courses", attributes: ["course"]},
                        {model: Grades, as: "grades", attributes: ["grade"]},
                        {model: Sections, as: "sections", attributes: ["seccion"]},
                        {model: Years, as: "years", attributes: ["year"]}
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
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.getTeachingBlockAverageByYearGroupAndStudent = async (req, res) => {
    try {
        const {studentId, yearId, assignmentId} = req.params;

        if (!studentId || !yearId || !assignmentId) {
            return res.status(400).json({message: "Faltan parámetros: studentId, yearId o assignmentId"});
        }

        const averages = await TeachingBlockAvarage.findAll({
            where: {studentId, assignmentId},
            include: [
                {
                    model: TeachingBlocks,
                    as: "teachingblocks",
                    attributes: ["id", "teachingBlock", "startDay", "endDay"],
                    where: {yearId},
                },
                {
                    model: TeacherGroups,
                    as: "teachergroups",
                    include: [
                        {model: Courses, as: "courses", attributes: ["id", "course"]},
                        {model: Grades, as: "grades", attributes: ["id", "grade"]},
                        {model: Sections, as: "sections", attributes: ["id", "seccion"]},
                        {model: Years, as: "years", attributes: ["id", "year"]},
                    ],
                },
                {
                    model: StudentsEnrollments,
                    as: "students",
                    attributes: ["id"],
                    include: [{model: Persons, as: "persons", attributes: ["id", "names", "lastNames"]}],
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
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};
