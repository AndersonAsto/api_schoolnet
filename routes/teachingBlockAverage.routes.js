const express = require("express");
const router = express.Router();
const Controller = require("../controllers/teachingBlockAverage.controller");

router.post("/teachingblockaverage/calculate", Controller.calculateTeachingBlockAverage);
router.post("/teachingblockaverage/preview", Controller.previewTeachingBlockAverage);
router.get("/teachingblockaverage/byStudent/:studentId", Controller.getTeachingBlockAverageByStudent);
router.get("/teachingblockaverage/byAssignment/:assignmentId", Controller.getTeachingBlockAverageByGroup);
router.get("/teachingblockaverage/byTeachingBlock/:teachingBlockId", Controller.getTeachingBlockAverageByBlock);
router.get(
    "/teachingblockaverage/byStudent/:studentId/year/:yearId/assignment/:assignmentId",
    Controller.getTeachingBlockAverageByYearGroupAndStudent
);

module.exports = router;
