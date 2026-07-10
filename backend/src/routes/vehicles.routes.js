import express from "express";
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicles.controller.js";

const router = express.Router();

/**
 * @route POST /api/vehicles
 * @desc Create a new vehicle record
 * @access Public
 *
 * @route GET /api/vehicles
 * @desc Retrieve all vehicles, optionally filtered
 * @access Public
 */
router.route("/")
  .post(createVehicle)
  .get(getVehicles);

/**
 * @route GET /api/vehicles/:id
 * @desc Retrieve a single vehicle by its database ID
 * @access Public
 *
 * @route PUT /api/vehicles/:id
 * @desc Update a vehicle's fields by ID
 * @access Public
 *
 * @route DELETE /api/vehicles/:id
 * @desc Delete a vehicle by ID
 * @access Public
 */
router.route("/:id")
  .get(getVehicleById)
  .put(updateVehicle)
  .delete(deleteVehicle);

export default router;
