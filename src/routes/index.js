const express = require("express");
const userRoutes = require("./userRoutes");
const groupRoutes = require("./groupRoutes");
const userGroupRoutes = require("./userGroupRoutes");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/groups", groupRoutes);
router.use("/user-groups", userGroupRoutes);

module.exports = router;
