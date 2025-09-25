const StudentEnrollments = require('../models/studentsEnrollments.model');
const Sections = require('../models/sections.model');
const Persons = require('../models/persons.model');
const Grades = require('../models/grades.model');
const Years = require('../models/years.model');

exports.createStudentEnrollment = async (req, res) => {
    try {
        
        const { studentId, yearId, gradeId, sectionId } = req.body;

        if ( !studentId || !yearId || !gradeId || !sectionId )
            return res.status(400).json({ error: 'No ha completado algunos campos' });

        const newStudentEnrollment = await StudentEnrollments.create({
            studentId, yearId, gradeId, sectionId
        })
        res.status(201).json(newStudentEnrollment);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al crear inscipción de estudiante: ', error
        });
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
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener incripciones de estudiantes', error
        });
    }
}