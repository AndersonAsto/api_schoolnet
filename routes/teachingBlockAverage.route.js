const express = require("express");
const router = express.Router();
const Controller = require("../controllers/teachingBlockAverage.controller");

router.post("/teachingblockaverage/calculate", Controller.calculateAndSaveAverage);
router.get("/teachingblockaverage/byStudent/:studentId", Controller.getAveragesByStudent);
router.get("/teachingblockaverage/bySchedule/:scheduleId", Controller.getAveragesBySchedule);
router.get("/teachingblockaverage/byTeachingBlock/:teachingBlockId", Controller.getAveragesByBlock);
router.get(
  '/teachingblockaverage/byStudent/:studentId/year/:yearId/schedule/:scheduleId',
  Controller.getAveragesByStudentYearSchedule
);

module.exports = router;
