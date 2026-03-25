const express = require("express");
const path = require("path");
const apiRoutes = require("./routes");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", apiRoutes);

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
