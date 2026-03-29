const express = require("express");
const path = require("path");
const apiRoutes = require("./routes");
const authRoutes = require("./routes/authRoutes");
const externalCaseRoutes = require("./routes/externalCaseRoutes");
const { requireApiAuth, requirePageAuth, getRequestSession, requireExternalApiKey } = require("./middleware/auth");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public"), { index: false }));

app.get("/login", (req, res) => {
  const { session } = getRequestSession(req);
  if (session) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/external-api/cases", requireExternalApiKey, externalCaseRoutes);
app.use("/api", requireApiAuth, apiRoutes);

app.get("/", requirePageAuth, (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/index.html", requirePageAuth, (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use((err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Unexpected server error.";

  // Normalize common PostgreSQL errors into API-friendly responses.
  if (err.code === "23505") {
    statusCode = 409;
    message = "A record with the same unique value already exists.";
  } else if (err.code === "23503") {
    statusCode = 400;
    message = "The referenced record does not exist or is still in use.";
  } else if (err.code === "22P02") {
    statusCode = 400;
    message = "One or more values use an invalid format.";
  }

  res.status(statusCode).json({
    error: message
  });
});

module.exports = app;
