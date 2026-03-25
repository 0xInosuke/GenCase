const express = require("express");
const groupController = require("../controllers/groupController");

const router = express.Router();

router.get("/", groupController.list);
router.get("/:id", groupController.getById);
router.post("/", groupController.create);
router.put("/:id", groupController.update);
router.delete("/:id", groupController.remove);

module.exports = router;
