const express = require("express");
const commentController = require("../controllers/commentController");

const router = express.Router();

router.get("/", commentController.list);
router.post("/", commentController.create);

module.exports = router;

