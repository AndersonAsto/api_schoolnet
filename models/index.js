const sequelize = require('../config/db.config');
const {Sequelize} = require('sequelize');

const AnnualAverage = require('./annualAverage.model');
const Attendances = require('./attendances.model');
const Courses = require('./courses.model');
const Evaluations = require('./evaluations.model');
const Grades = require('./grades.model');
const Holidays = require('./holidays.model');
const Incidents = require('./incidents.model');
const OverallCourseAverage = require('./overallCourseAverage.model');
const ParentAssignments = require('./parentAssignments.model');
const Persons = require('./persons.model');
const Qualifications = require('./qualifications.model');
const Schedules = require('./schedules.model');
const SchoolDays = require('./schoolDays.model');
const SchoolDaysBySchedule = require('./schoolDaysBySchedule.model');
const Sections = require('./sections.model');
const StudentEnrollments = require('./studentEnrollments.model');
const TeacherAssignments = require('./teacherAssignments.model');
const TeacherGroups = require('./teacherGroups.model');
const TeachingBlockAverage = require('./teachingBlockAverage.model');
const TeachingBlocks = require('./teachingBlocks.model');
const Tutors = require('./tutors.model');
const Users = require('./users.model');
const Years = require('./years.model');

module.exports = {
    sequelize,
    Sequelize,
    AnnualAverage,
    Attendances,
    Courses,
    Evaluations,
    Grades,
    Holidays,
    Incidents,
    OverallCourseAverage,
    ParentAssignments,
    Persons,
    Qualifications,
    Schedules,
    SchoolDays,
    SchoolDaysBySchedule,
    Sections,
    StudentEnrollments,
    TeacherAssignments,
    TeacherGroups,
    TeachingBlockAverage,
    TeachingBlocks,
    Tutors,
    Users,
    Years,
};
