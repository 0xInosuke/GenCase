const express = require("express");
const workflowController = require("../controllers/workflowController");

const router = express.Router();

router.get("/", workflowController.list);
router.get("/:id", workflowController.getById);
router.post("/", workflowController.create);
router.put("/:id", workflowController.update);
router.delete("/:id", workflowController.remove);

module.exports = router;

