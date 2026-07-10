import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import requestLogger from "./middleware/requestLogger.js";
import errorHandler from "./middleware/errorHandler.js";

import healthRoutes from "./routes/health.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import vehiclesRoutes from "./routes/vehicles.routes.js";

dotenv.config();

const app = express();

// Global Middlewares
app.use(requestLogger);
app.use(cors());
app.use(express.json());

// Default Route
app.get("/", (req, res) => {
  res.send("FleetDash Backend Running 🚀");
});

// API Routes
app.use("/api/health", healthRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/vehicles", vehiclesRoutes);

// Global Error Handler (must be last)
app.use(errorHandler);

export default app;
