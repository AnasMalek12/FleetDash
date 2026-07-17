import dotenv from "dotenv";
import { connectRedis, disconnectRedis } from "../redis/redisClient.js";
import { publishMessage, subscribeToChannel } from "../redis/pubSub.js";

dotenv.config();

async function run() {
  console.log("🚀 Starting Redis Pub/Sub integration test script...");
  
  try {
    await connectRedis();

    const channel = "telemetry:updates";
    let messageReceivedCount = 0;

    // 1. Subscribe to channel
    await subscribeToChannel(channel, (data) => {
      messageReceivedCount++;
      console.log(`📥 Received telemetry update #${messageReceivedCount} on channel "${channel}":`, data);
    });

    // 2. Publish mock telemetry messages
    const mockTelemetryData = [
      { id: "vehicle-101", name: "Truck Alpha", coordinates: [40.7128, -74.006], speed: 45 },
      { id: "vehicle-102", name: "Van Beta", coordinates: [40.7135, -74.0075], speed: 30 },
      { id: "vehicle-103", name: "Car Gamma", coordinates: [40.7112, -74.005], speed: 55 },
    ];

    console.log("📤 Publishing test telemetry updates...");
    for (const data of mockTelemetryData) {
      await publishMessage(channel, data);
    }

    // Wait for messages to arrive (Pub/Sub loopback)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log(`📊 Test Summary: Messages Published: ${mockTelemetryData.length}, Messages Received: ${messageReceivedCount}`);

    if (messageReceivedCount === mockTelemetryData.length) {
      console.log("💚 SUCCESS: All messages successfully routed via Redis Pub/Sub!");
    } else {
      console.error("🔴 FAILURE: Expected 3 messages, received: " + messageReceivedCount);
    }
  } catch (error) {
    console.error("🔴 Test script encountered a fatal error:", error.message || error);
  } finally {
    await disconnectRedis();
    process.exit(0);
  }
}

run();
