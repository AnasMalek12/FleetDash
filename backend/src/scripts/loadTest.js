import autocannon from "autocannon";
import mongoose from "mongoose";
import app from "../app.js";
import Vehicle from "../models/vehicle.model.js";
import { closeWorkerPools } from "../workers/workerRunner.js";

const PORT = 5001; // Separate port for load testing

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

const mockPoints = [];
for (let i = 0; i < 50; i++) {
  mockPoints.push({
    id: `vehicle-${i}`,
    coordinates: [Math.random() * 15, Math.random() * 15],
  });
}

async function runBenchmark(options) {
  console.log(`\n🚀 Starting benchmark for: ${options.title} (${options.url})`);
  console.log(`   Connections: ${options.connections}, Duration: ${options.duration}s`);
  
  return new Promise((resolve, reject) => {
    autocannon(options, (err, result) => {
      if (err) {
        return reject(err);
      }
      // Print custom formatted summary
      console.log(`   ---------------------------------------------`);
      console.log(`   Metrics:`);
      console.log(`     Average Latency: ${result.latency.average} ms`);
      console.log(`     Max Latency:     ${result.latency.max} ms`);
      console.log(`     p50 (Median):    ${result.latency.p50} ms`);
      console.log(`     p90:             ${result.latency.p90} ms`);
      console.log(`     p99:             ${result.latency.p99} ms`);
      console.log(`   Throughput:`);
      console.log(`     Average Req/Sec: ${result.requests.average}`);
      console.log(`     Total Requests:  ${result.requests.total}`);
      console.log(`     Total Errors:    ${result.errors}`);
      console.log(`     Timeouts:        ${result.timeouts}`);
      console.log(`   ---------------------------------------------`);
      resolve(result);
    });
  });
}

async function main() {
  const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/fleetdash";
  
  console.log("🔋 Connecting to MongoDB...");
  await mongoose.connect(mongoURI);
  console.log("💚 Connected successfully.");

  // Seed 100 dummy vehicles
  console.log("🧹 Cleaning up old load test vehicles...");
  await Vehicle.deleteMany({ name: /^LoadTest Vehicle/ });
  
  console.log("🌱 Seeding 100 LoadTest Vehicles...");
  const dummyVehicles = [];
  for (let i = 0; i < 100; i++) {
    dummyVehicles.push({
      name: `LoadTest Vehicle ${i}`,
      licensePlate: `LT-${1000 + i}-XX`,
      type: i % 3 === 0 ? "truck" : i % 3 === 1 ? "car" : "van",
      status: i % 2 === 0 ? "active" : "maintenance",
      currentLocation: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.006 + (Math.random() - 0.5) * 0.1,
      },
    });
  }
  await Vehicle.insertMany(dummyVehicles);
  console.log("🌱 Seeding complete.");

  // Start Server
  console.log(`⚡ Starting Express server on port ${PORT}...`);
  const server = app.listen(PORT, async () => {
    console.log(`🚀 Load test server running on http://localhost:${PORT}`);
    
    try {
      const duration = 5; // shorter duration of 5s per test for comparative runs
      const connections = 50; // concurrent connections

      console.log("\n=============================================");
      console.log("PHASE 1: BENCHMARK WITH REQUEST LOGGING ENABLED");
      console.log("=============================================");
      process.env.BYPASS_LOGGER = "false";
      
      const resultsWithLogger = {
        baseline: await runBenchmark({
          title: "GET / (Baseline Endpoint)",
          url: `http://localhost:${PORT}/`,
          connections,
          duration,
        }),
        db: await runBenchmark({
          title: "GET /api/vehicles (Database Query)",
          url: `http://localhost:${PORT}/api/vehicles`,
          connections,
          duration,
        }),
        worker: await runBenchmark({
          title: "POST /api/jobs/geofence-check (Worker Threads CPU Geofencing)",
          url: `http://localhost:${PORT}/api/jobs/geofence-check`,
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            points: mockPoints,
            geofences: mockGeofences,
          }),
          connections: 20,
          duration,
        }),
      };

      console.log("\n=============================================");
      console.log("PHASE 2: BENCHMARK WITH REQUEST LOGGING BYPASSED");
      console.log("=============================================");
      process.env.BYPASS_LOGGER = "true";

      const resultsWithoutLogger = {
        baseline: await runBenchmark({
          title: "GET / (Baseline Endpoint)",
          url: `http://localhost:${PORT}/`,
          connections,
          duration,
        }),
        db: await runBenchmark({
          title: "GET /api/vehicles (Database Query)",
          url: `http://localhost:${PORT}/api/vehicles`,
          connections,
          duration,
        }),
        worker: await runBenchmark({
          title: "POST /api/jobs/geofence-check (Worker Threads CPU Geofencing)",
          url: `http://localhost:${PORT}/api/jobs/geofence-check`,
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            points: mockPoints,
            geofences: mockGeofences,
          }),
          connections: 20,
          duration,
        }),
      };

      console.log("\n=============================================");
      console.log("📊 LOGGER IMPACT COMPARISON (Average Requests/sec)");
      console.log("=============================================");
      
      const compare = (val1, val2) => {
        const diff = val2 - val1;
        const pct = (diff / val1) * 100;
        return `${val1.toFixed(1)} -> ${val2.toFixed(1)} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`;
      };

      console.log(`GET /:                         ${compare(resultsWithLogger.baseline.requests.average, resultsWithoutLogger.baseline.requests.average)}`);
      console.log(`GET /api/vehicles:             ${compare(resultsWithLogger.db.requests.average, resultsWithoutLogger.db.requests.average)}`);
      console.log(`POST /api/jobs/geofence-check: ${compare(resultsWithLogger.worker.requests.average, resultsWithoutLogger.worker.requests.average)}`);
      
      console.log("\n=============================================");
      console.log("📊 LATENCY COMPARISON (Average Latency in ms)");
      console.log("=============================================");
      
      const compareLatency = (val1, val2) => {
        const diff = val2 - val1;
        const pct = (diff / val1) * 100;
        return `${val1.toFixed(2)} ms -> ${val2.toFixed(2)} ms (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% latency change)`;
      };
      
      console.log(`GET /:                         ${compareLatency(resultsWithLogger.baseline.latency.average, resultsWithoutLogger.baseline.latency.average)}`);
      console.log(`GET /api/vehicles:             ${compareLatency(resultsWithLogger.db.latency.average, resultsWithoutLogger.db.latency.average)}`);
      console.log(`POST /api/jobs/geofence-check: ${compareLatency(resultsWithLogger.worker.latency.average, resultsWithoutLogger.worker.latency.average)}`);
      console.log("=============================================");

    } catch (err) {
      console.error("🔴 Benchmark error:", err);
    } finally {
      console.log("\n🧹 Cleaning up Database...");
      await Vehicle.deleteMany({ name: /^LoadTest Vehicle/ });
      
      console.log("🛑 Shutting down server and connections...");
      server.close(async () => {
        console.log("👋 Express server shut down.");
        await mongoose.connection.close();
        console.log("👋 MongoDB connection closed.");
        await closeWorkerPools();
        console.log("👋 Worker pools terminated.");
        process.exit(0);
      });
    }
  });
}

main().catch((err) => {
  console.error("Fatal Load Test Error:", err);
  process.exit(1);
});
