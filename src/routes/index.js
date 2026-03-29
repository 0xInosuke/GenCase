const express = require("express");
const userRoutes = require("./userRoutes");
const groupRoutes = require("./groupRoutes");
const userGroupRoutes = require("./userGroupRoutes");
const workflowRoutes = require("./workflowRoutes");
const caseRoutes = require("./caseRoutes");
const commentRoutes = require("./commentRoutes");
const auditRoutes = require("./auditRoutes");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/groups", groupRoutes);
router.use("/user-groups", userGroupRoutes);
router.use("/workflows", workflowRoutes);
router.use("/cases", caseRoutes);
router.use("/comments", commentRoutes);
router.use("/audits", auditRoutes);

module.exports = router;
