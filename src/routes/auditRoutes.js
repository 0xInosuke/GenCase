const express = require("express");
const auditController = require("../controllers/auditController");

const router = express.Router();

router.get("/", auditController.list);

module.exports = router;
