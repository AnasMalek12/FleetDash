import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import Vehicle from "../models/vehicle.model.js";

describe("Vehicles API Endpoints", () => {
  beforeAll(async () => {
    const testURI = process.env.MONGO_URI || "mongodb://localhost:27017/fleetdash_test";
    await mongoose.connect(testURI);
  });

  afterAll(async () => {
    await Vehicle.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Vehicle.deleteMany({});
  });

  const sampleVehicle = {
    name: "Delivery Truck 1",
    licensePlate: "AB-123-CD",
    type: "truck",
    status: "active",
    currentLocation: {
      latitude: 40.7128,
      longitude: -74.006,
    },
  };

  describe("POST /api/vehicles", () => {
    it("should create a new vehicle with valid data", async () => {
      const response = await request(app)
        .post("/api/vehicles")
        .send(sampleVehicle)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(sampleVehicle.name);
      expect(response.body.data.licensePlate).toBe(sampleVehicle.licensePlate);
      expect(response.body.data.currentLocation.latitude).toBe(
        sampleVehicle.currentLocation.latitude
      );
    });

    it("should fail validation if license plate is missing", async () => {
      const invalidVehicle = { ...sampleVehicle };
      delete invalidVehicle.licensePlate;

      const response = await request(app)
        .post("/api/vehicles")
        .send(invalidVehicle)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("License plate is required");
    });

    it("should fail validation if type is invalid", async () => {
      const invalidVehicle = { ...sampleVehicle, type: "airplane" };

      const response = await request(app)
        .post("/api/vehicles")
        .send(invalidVehicle)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("is not a valid vehicle type");
    });

    it("should fail validation if latitude is out of bounds", async () => {
      const invalidVehicle = {
        ...sampleVehicle,
        currentLocation: { latitude: 95, longitude: -74.006 },
      };

      const response = await request(app)
        .post("/api/vehicles")
        .send(invalidVehicle)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Latitude must be between -90 and 90");
    });

    it("should prevent duplicate license plates", async () => {
      await Vehicle.create(sampleVehicle);

      const response = await request(app)
        .post("/api/vehicles")
        .send(sampleVehicle)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("already exists");
    });
  });

  describe("GET /api/vehicles", () => {
    it("should retrieve all vehicles", async () => {
      await Vehicle.create(sampleVehicle);
      await Vehicle.create({
        name: "Service Van 2",
        licensePlate: "XY-987-ZZ",
        type: "van",
        status: "maintenance",
      });

      const response = await request(app)
        .get("/api/vehicles")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it("should retrieve filtered vehicles by status or type", async () => {
      await Vehicle.create(sampleVehicle); // active, truck
      await Vehicle.create({
        name: "Service Van 2",
        licensePlate: "XY-987-ZZ",
        type: "van",
        status: "maintenance",
      });

      const response = await request(app)
        .get("/api/vehicles?status=maintenance")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].type).toBe("van");
    });
  });

  describe("GET /api/vehicles/:id", () => {
    it("should retrieve a single vehicle by ID", async () => {
      const created = await Vehicle.create(sampleVehicle);

      const response = await request(app)
        .get(`/api/vehicles/${created._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.licensePlate).toBe(sampleVehicle.licensePlate);
    });

    it("should return 404 for a non-existent vehicle ID", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/vehicles/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Vehicle not found");
    });

    it("should return 400 for an invalid ID format", async () => {
      const response = await request(app)
        .get("/api/vehicles/invalid-id-format")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid vehicle ID format");
    });
  });

  describe("PUT /api/vehicles/:id", () => {
    it("should update a vehicle's properties with valid data", async () => {
      const created = await Vehicle.create(sampleVehicle);

      const response = await request(app)
        .put(`/api/vehicles/${created._id}`)
        .send({ status: "maintenance", name: "Updated Truck Name" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("maintenance");
      expect(response.body.data.name).toBe("Updated Truck Name");
    });
  });

  describe("DELETE /api/vehicles/:id", () => {
    it("should delete a vehicle by ID", async () => {
      const created = await Vehicle.create(sampleVehicle);

      const response = await request(app)
        .delete(`/api/vehicles/${created._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted successfully");

      const check = await Vehicle.findById(created._id);
      expect(check).toBeNull();
    });
  });
});
