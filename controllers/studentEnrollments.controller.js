const StudentEnrollments = require('../models/studentEnrollments.model');
const Sections = require('../models/sections.model');
const Persons = require('../models/persons.model');
const Grades = require('../models/grades.model');
const Years = require('../models/years.model');
const Schedules = require('../models/schedules.model');
const TeacherGroups = require('../models/teacherGroups.model');
const Tutors = require('../models/tutors.model');

exports.createStudentEnrollment = async (req, res) => {
    try {

        const { studentId, yearId, gradeId, sectionId } = req.body;

        if (!studentId || !yearId || !gradeId || !sectionId)
            return res.status(400).json({ error: 'No ha completado algunos campos' });

        const newStudentEnrollment = await StudentEnrollments.create({
            studentId, yearId, gradeId, sectionId
        })
        res.status(201).json(newStudentEnrollment);

    } catch (error) {
       console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getStudentEnrollments = async (req, res) => {
    try {
        const studentEnrollments = await StudentEnrollments.findAll({
            include: [
                {
                    model: Persons,
                    as: 'persons',
                    attributes: ['id', 'names', 'lastNames', 'role']
                },
                {
                    model: Years,
                    as: 'years',
                    attributes: ['id', 'year']
                },
                {
                    model: Sections,
                    as: 'sections',
                    attributes: ['id', 'seccion']
                },
                {
                    model: Grades,
                    as: 'grades',
                    attributes: ['id', 'grade']
                }
            ],
            attributes: ['id', 'status', 'createdAt', 'updatedAt']
        });
        res.json(studentEnrollments);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.getStudentsBySchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        if (!scheduleId) {
            return res.status(400).json({ message: "El identificador del horario es requerido" });
        }

        // Buscar el horario seleccionado
        const schedule = await Schedules.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({ message: "Horario no encontrado" });
        }

        // Buscar estudiantes del mismo grado y sección (y opcionalmente mismo año)
        const students = await StudentEnrollments.findAll({
            where: {
                gradeId: schedule.gradeId,
                sectionId: schedule.sectionId,
                yearId: schedule.yearId, // 🔸 opcional si deseas filtrar también por año
                status: true,
            },
            include: [
                {
                    model: Persons,
                    as: "persons",
                    attributes: ["id", "names", "lastNames", "role"],
                },
                {
                    model: Grades,
                    as: "grades",
                    attributes: ["id", "grade"],
                },
                {
                    model: Sections,
                    as: "sections",
                    attributes: ["id", "seccion"],
                },
                {
                    model: Years,
                    as: "years",
                    attributes: ["id", "year"],
                },
            ],
            order: [[{ model: Persons, as: "persons" }, "lastNames", "ASC"]],
        });

        return res.status(200).json(students);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.getStudentsByGroup = async (req, res) => {
    try {
        const { asigmentId } = req.params;

        if (!asigmentId) {
            return res.status(400).json({ message: "El identificador del grupo es requerido" });
        }

        // Buscar el horario seleccionado
        const group = await TeacherGroups.findByPk(asigmentId);
        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado" });
        }

        // Buscar estudiantes del mismo grado y sección (y opcionalmente mismo año)
        const students = await StudentEnrollments.findAll({
            where: {
                gradeId: group.gradeId,
                sectionId: group.sectionId,
                yearId: group.yearId,
                status: true,
            },
            include: [
                {
                    model: Persons,
                    as: "persons",
                    attributes: ["id", "names", "lastNames", "role"],
                },
                {
                    model: Grades,
                    as: "grades",
                    attributes: ["id", "grade"],
                },
                {
                    model: Sections,
                    as: "sections",
                    attributes: ["id", "seccion"],
                },
                {
                    model: Years,
                    as: "years",
                    attributes: ["id", "year"],
                },
            ],
            order: [[{ model: Persons, as: "persons" }, "lastNames", "ASC"]],
        });

        return res.status(200).json(students);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.getStudentsByTutorGroup = async (req, res) => {
    try {
        const { tutorId, yearId } = req.params;

        if (!tutorId || !yearId) {
            return res.status(400).json({ message: "No ha seleccionado un año o tutor." });
        }

        // Buscamos el grupo de tutor para ese año específico
        const group = await Tutors.findOne({
            where: {
                id: tutorId,
                yearId: yearId,
                status: true,
            },
        });

        if (!group) {
            return res.status(404).json({ message: "Grupo de tutor no encontrado para ese año." });
        }

        const students = await StudentEnrollments.findAll({
            where: {
                gradeId: group.gradeId,
                sectionId: group.sectionId,
                yearId: yearId, // <- usamos el parámetro yearId
                status: true,
            },
            include: [
                {
                    model: Persons,
                    as: "persons",
                    attributes: ["id", "names", "lastNames", "role"],
                },
                {
                    model: Grades,
                    as: "grades",
                    attributes: ["id", "grade"],
                },
                {
                    model: Sections,
                    as: "sections",
                    attributes: ["id", "seccion"],
                },
                {
                    model: Years,
                    as: "years",
                    attributes: ["id", "year"],
                },
            ],
            order: [[{ model: Persons, as: "persons" }, "lastNames", "ASC"]],
        });

        return res.status(200).json(students);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
};

exports.updateStudentEnrollment = async (req, res) => {
    const { id } = req.params;
    const { studentId, yearId, gradeId, sectionId } = req.body;
    try {
        const students = await StudentEnrollments.findByPk(id);

        if (!students) {
            return res.status(404).json({ message: 'Estudiante no encontrado.' });
        }

        students.studentId = studentId;
        students.yearId = yearId;
        students.gradeId = gradeId;
        students.sectionId = sectionId;

        await students.save();
        res.status(200).json(students);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}

exports.deleteStudentEnrollment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Identificador inválido o no proporcionado.' });
        }

        const deleted = await StudentEnrollments.destroy({ where: { id } });

        if (deleted === 0) {
            return res.status(404).json({ message: 'Estudiante no encontrado.' });
        }

        res.status(200).json({ message: 'Estudiante eliminado correctamente.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error interno del servidor. Inténtelo de nuevo más tarde.' });
    }
}
