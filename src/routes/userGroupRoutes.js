const express = require("express");
const userGroupController = require("../controllers/userGroupController");

const router = express.Router();

router.get("/", userGroupController.list);
router.get("/:id", userGroupController.getById);
router.post("/", userGroupController.create);
router.put("/:id", userGroupController.update);
router.delete("/:id", userGroupController.remove);

module.exports = router;
