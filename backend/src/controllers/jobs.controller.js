import { runWorker } from "../workers/workerRunner.js";

/**
 * Handles geofence checking operations using a worker thread.
 * Validates request payload and schedules worker thread execution.
 */
export async function checkGeofences(req, res) {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error:
          "Request body is missing. Please ensure your request contains a JSON payload and the 'Content-Type: application/json' header is set.",
      });
    }

    const { points, geofences } = req.body;

    if (!points || !Array.isArray(points)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid 'points' field. Must be an array.",
      });
    }

    if (!geofences || !Array.isArray(geofences)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid 'geofences' field. Must be an array.",
      });
    }

    // Run the heavy geofence computation in a background worker thread
    const result = await runWorker("geofence.worker.js", { points, geofences });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Geofence worker execution error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred during geofence checking.",
    });
  }
}
