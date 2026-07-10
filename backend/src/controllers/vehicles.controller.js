import Vehicle from "../models/vehicle.model.js";

/**
 * Creates a new vehicle.
 */
export async function createVehicle(req, res, next) {
  try {
    const { name, licensePlate, type, status, currentLocation } = req.body;

    const vehicle = new Vehicle({
      name,
      licensePlate,
      type,
      status,
      currentLocation,
    });

    await vehicle.save();

    return res.status(201).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A vehicle with this license plate already exists.",
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }
    next(error);
  }
}

/**
 * Retrieves all vehicles, optionally filtered by status and type.
 */
export async function getVehicles(req, res, next) {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    const vehicles = await Vehicle.find(filter);

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves a vehicle by ID.
 */
export async function getVehicleById(req, res, next) {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: `Vehicle not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: `Invalid vehicle ID format: ${req.params.id}`,
      });
    }
    next(error);
  }
}

/**
 * Updates a vehicle by ID.
 */
export async function updateVehicle(req, res, next) {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: `Vehicle not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A vehicle with this license plate already exists.",
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: `Invalid vehicle ID format: ${req.params.id}`,
      });
    }
    next(error);
  }
}

/**
 * Deletes a vehicle by ID.
 */
export async function deleteVehicle(req, res, next) {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: `Vehicle not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: `Invalid vehicle ID format: ${req.params.id}`,
      });
    }
    next(error);
  }
}
