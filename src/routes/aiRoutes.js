const express = require("express");
const aiController = require("../controllers/aiController");

const router = express.Router();

router.post("/case-search", aiController.runCaseSearch);

module.exports = router;
