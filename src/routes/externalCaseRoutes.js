const express = require("express");
const externalCaseController = require("../controllers/externalCaseController");

const router = express.Router();

router.get("/", externalCaseController.list);
router.get("/:id", externalCaseController.getById);
router.post("/", externalCaseController.create);
router.put("/:id", externalCaseController.update);

module.exports = router;
