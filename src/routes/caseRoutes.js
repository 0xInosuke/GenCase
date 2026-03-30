const express = require("express");
const caseController = require("../controllers/caseController");

const router = express.Router();

router.get("/", caseController.list);
router.get("/:id/export", caseController.export);
router.get("/:id", caseController.getById);
router.post("/", caseController.create);
router.put("/:id", caseController.update);
router.delete("/:id", caseController.remove);

module.exports = router;

