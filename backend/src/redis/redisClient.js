import { createClient, createCluster } from "redis";

let redisClient = null;
let subscriberClient = null;

/**
 * Configure and initialize Redis clients (or clusters).
 */
export async function connectRedis() {
  const useCluster = process.env.USE_REDIS_CLUSTER === "true";
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const clusterNodes = process.env.REDIS_CLUSTER_NODES;

  console.log(`🔋 Initializing Redis in ${useCluster ? "CLUSTER" : "STANDALONE"} mode...`);

  if (useCluster) {
    const rootNodes = clusterNodes
      ? clusterNodes.split(",").map((node) => ({ url: node.trim() }))
      : [{ url: "redis://127.0.0.1:7000" }];

    redisClient = createCluster({ rootNodes });
    subscriberClient = createCluster({ rootNodes });
  } else {
    redisClient = createClient({ url: redisUrl });
    subscriberClient = createClient({ url: redisUrl });
  }

  // Handle Event Logs & Error Catching
  const setupLogs = (client, name) => {
    client.on("error", (err) => {
      console.error(`🔴 Redis [${name}] error:`, err.message || err);
    });

    client.on("ready", () => {
      console.log(`💚 Redis [${name}] connection established and ready.`);
    });

    client.on("reconnecting", () => {
      console.warn(`🔄 Redis [${name}] reconnecting...`);
    });

    client.on("end", () => {
      console.warn(`⚠️ Redis [${name}] connection closed.`);
    });
  };

  setupLogs(redisClient, "Publisher/Client");
  setupLogs(subscriberClient, "Subscriber");

  try {
    await Promise.all([
      redisClient.connect(),
      subscriberClient.connect(),
    ]);
  } catch (error) {
    console.error("🔴 Failed to connect to Redis:", error.message || error);
    throw error;
  }
}

/**
 * Gracefully disconnect and clean up all Redis client connections.
 */
export async function disconnectRedis() {
  console.log("🛑 Disconnecting Redis clients...");
  const disconnectTasks = [];

  if (redisClient) {
    disconnectTasks.push(
      redisClient.disconnect().catch((err) => console.error("Error disconnecting redisClient:", err.message))
    );
  }

  if (subscriberClient) {
    disconnectTasks.push(
      subscriberClient.disconnect().catch((err) => console.error("Error disconnecting subscriberClient:", err.message))
    );
  }

  await Promise.all(disconnectTasks);
  redisClient = null;
  subscriberClient = null;
  console.log("👋 Redis clients disconnected.");
}

/**
 * Retrieves the primary Redis client (publisher/query runner).
 */
export function getRedisClient() {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return redisClient;
}

/**
 * Retrieves the duplicate Redis subscriber client.
 */
export function getSubscriberClient() {
  if (!subscriberClient) {
    throw new Error("Redis subscriber client not initialized. Call connectRedis() first.");
  }
  return subscriberClient;
}
