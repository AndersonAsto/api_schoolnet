// models/index.js
const sequelize = require('../config/db.config');
const { Sequelize } = require('sequelize');

const Person = require('./persons.model');
const Users = require('./users.model');
const Courses = require('./courses.model');
const Years = require('./years.model');
const Grade = require('./grades.model');
const Section = require('./sections.model');
const StudentEnrollment = require('./studentEnrollments.model');
const TutorTeacher = require('./tutors.model');
const TeacherAssignment = require('./teacherAssignments.model');
const TeacherGroup = require('./teacherGroups.model');
const OverallCourseAverage = require('./overallCourseAverage.model');
const TeachingBlockAverage = require('./teachingBlockAverage.model');
const TeachingBlock = require('./teachingBlocks.model');
const AnnualAverage = require('./annualAverage.model');

module.exports = {
    sequelize,
    Sequelize,
    Person,
    Users,
    Years,
    Grade,
    Section,
    StudentEnrollment,
    TutorTeacher,
    TeacherAssignment,
    TeacherGroup,
    OverallCourseAverage,
    TeachingBlockAverage,
    TeachingBlock,
    AnnualAverage,
    Courses,
};
