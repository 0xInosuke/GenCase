const express = require("express");
const aiController = require("../controllers/aiController");

const router = express.Router();

router.get("/status", aiController.getStatus);
router.post("/case-search", aiController.runCaseSearch);
router.post("/workflow-design", aiController.runWorkflowDesign);

module.exports = router;
