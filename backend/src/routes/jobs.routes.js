import express from "express";
import { checkGeofences } from "../controllers/jobs.controller.js";

const router = express.Router();

/**
 * @route POST /api/jobs/geofence-check
 * @desc Check if multiple coordinates are within a set of polygon geofences using a worker thread
 * @access Public
 */
router.post("/geofence-check", checkGeofences);

export default router;
