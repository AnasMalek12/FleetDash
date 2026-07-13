import request from "supertest";
import app from "../app.js";
import { runWorker, closeWorkerPools } from "../workers/workerRunner.js";

describe("Worker Threads Baseline & Geofencing Route Tests", () => {
  afterAll(async () => {
    await closeWorkerPools();
  });

  const mockGeofences = [
    {
      id: "zone-1",
      name: "Downtown Zone",
      coordinates: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ],
    },
  ];

  const mockPoints = [
    {
      id: "vehicle-inside",
      coordinates: [5, 5],
    },
    {
      id: "vehicle-outside",
      coordinates: [15, 15],
    },
  ];

  describe("Direct worker execution via runWorker", () => {
    it("should process geofence checks correctly in a worker thread", async () => {
      const results = await runWorker("geofence.worker.js", {
        points: mockPoints,
        geofences: mockGeofences,
      });

      expect(results).toHaveLength(2);

      const insideVehicle = results.find(
        (r) => r.vehicleId === "vehicle-inside"
      );
      expect(insideVehicle).toBeDefined();
      expect(insideVehicle.insideZones).toHaveLength(1);
      expect(insideVehicle.insideZones[0].id).toBe("zone-1");

      const outsideVehicle = results.find(
        (r) => r.vehicleId === "vehicle-outside"
      );
      expect(outsideVehicle).toBeDefined();
      expect(outsideVehicle.insideZones).toHaveLength(0);
    });

    it("should throw an error if worker payload is invalid", async () => {
      await expect(runWorker("geofence.worker.js", {})).rejects.toThrow();
    });

    it("should process multiple geofence checks sequentially or concurrently with high performance", async () => {
      const startTime = Date.now();
      const numRuns = 15;
      const tasks = [];
      for (let i = 0; i < numRuns; i++) {
        tasks.push(
          runWorker("geofence.worker.js", {
            points: mockPoints,
            geofences: mockGeofences,
          })
        );
      }
      const allResults = await Promise.all(tasks);
      const duration = Date.now() - startTime;
      console.log(`[Performance] Executed ${numRuns} geofencing tasks in parallel in ${duration}ms using Worker Pool`);

      expect(allResults).toHaveLength(numRuns);
      for (const results of allResults) {
        expect(results).toHaveLength(2);
      }
    });
  });

  describe("POST /api/jobs/geofence-check", () => {
    it("should run geofencing checks via endpoint", async () => {
      const response = await request(app)
        .post("/api/jobs/geofence-check")
        .send({
          points: mockPoints,
          geofences: mockGeofences,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveLength(2);

      const insideVehicle = response.body.data.find(
        (r) => r.vehicleId === "vehicle-inside"
      );
      expect(insideVehicle.insideZones[0].name).toBe("Downtown Zone");
    });

    it("should return 400 bad request if points is missing", async () => {
      await request(app)
        .post("/api/jobs/geofence-check")
        .send({
          geofences: mockGeofences,
        })
        .expect(400);
    });

    it("should return 400 bad request if geofences is missing", async () => {
      await request(app)
        .post("/api/jobs/geofence-check")
        .send({
          points: mockPoints,
        })
        .expect(400);
    });
  });
});
