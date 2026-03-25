const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/", userController.list);
router.get("/:id", userController.getById);
router.post("/", userController.create);
router.put("/:id", userController.update);
router.delete("/:id", userController.remove);

module.exports = router;
