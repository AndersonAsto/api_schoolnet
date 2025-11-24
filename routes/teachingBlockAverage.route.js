const express = require("express");
const router = express.Router();
const Controller = require("../controllers/teachingBlockAverage.controller");

// 📘 Calcular y guardar promedio de bloques lectivos
router.post("/teachingblockaverage/calculate", Controller.calculateTeachingBlockAverage);
router.post("/teachingblockaverage/preview", Controller.previewTeachingBlockAverage);

// 📘 Obtener promedios por estudiante
router.get("/teachingblockaverage/byStudent/:studentId", Controller.getTeachingBlockAverageByStudent);

// 📘 Obtener promedios por grupo docente (assignmentId → TeacherGroups)
router.get("/teachingblockaverage/byAssignment/:assignmentId", Controller.getTeachingBlockAverageByGroup);

// 📘 Obtener promedios por bloque lectivo
router.get("/teachingblockaverage/byTeachingBlock/:teachingBlockId", Controller.getTeachingBlockAverageByBlock);

// 📘 Obtener promedios por estudiante, año y grupo docente
router.get(
    "/teachingblockaverage/byStudent/:studentId/year/:yearId/assignment/:assignmentId",
    Controller.getTeachingBlockAverageByYearGroupAndStudent
);

module.exports = router;
