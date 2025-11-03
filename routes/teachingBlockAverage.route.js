const express = require("express");
const router = express.Router();
const Controller = require("../controllers/teachingBlockAverage.controller");

// 📘 Calcular y guardar promedio de bloques lectivos
router.post("/teachingblockaverage/calculate", Controller.calculateAndSaveAverage);

// 📘 Obtener promedios por estudiante
router.get("/teachingblockaverage/byStudent/:studentId", Controller.getAveragesByStudent);

// 📘 Obtener promedios por grupo docente (assignmentId → TeacherGroups)
router.get("/teachingblockaverage/byAssignment/:assignmentId", Controller.getAveragesByAssignment);

// 📘 Obtener promedios por bloque lectivo
router.get("/teachingblockaverage/byTeachingBlock/:teachingBlockId", Controller.getAveragesByBlock);

// 📘 Obtener promedios por estudiante, año y grupo docente
router.get(
  "/teachingblockaverage/byStudent/:studentId/year/:yearId/assignment/:assignmentId",
  Controller.getAveragesByStudentYearAssignment
);

module.exports = router;
