import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import appConfig from "./config/app-config.js";
import routes from "./routes/index.js";

const app = express();
const { PORT, FRONTEND_URL } = appConfig;

// Middleware
app.use(helmet()); // Security
app.use(morgan("combined")); // Logging
app.use(express.json()); // Parse JSON
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
); // CORS for all origins

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", routes);

// Error handler
app.use((err, req, res, next) => {
  console.error("Error handler:", err.stack || err);

  // Don't send response if headers already sent
  if (!res.headersSent) {
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// 404 handler (FIXED: Named wildcard to comply with Express v5)
app.use("/*splat", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
