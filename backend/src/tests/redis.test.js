import { connectRedis, disconnectRedis } from "../redis/redisClient.js";
import { publishMessage, subscribeToChannel, unsubscribeFromChannel } from "../redis/pubSub.js";

describe("Redis Client and Pub/Sub Integration Tests", () => {
  beforeAll(async () => {
    try {
      await connectRedis();
    } catch (err) {
      console.warn("⚠️ Redis cluster/standalone is not running. Integration tests will fail.");
      throw err;
    }
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  it("should subscribe to a channel, receive published JSON message, and parse it", async () => {
    const channel = "test:json-channel";
    const payload = { event: "telemetry", values: [1.23, 4.56], timestamp: Date.now() };

    const receivePromise = new Promise((resolve) => {
      subscribeToChannel(channel, (message) => {
        resolve(message);
      });
    });

    // Small delay to ensure subscription finishes registering
    await new Promise((resolve) => setTimeout(resolve, 150));

    const subscribersCount = await publishMessage(channel, payload);
    expect(subscribersCount).toBeGreaterThanOrEqual(1);

    const receivedPayload = await receivePromise;
    expect(receivedPayload).toEqual(payload);

    await unsubscribeFromChannel(channel);
  });

  it("should support publishing and parsing plain string payloads", async () => {
    const channel = "test:string-channel";
    const text = "System alerts: database capacity reached 90%";

    const receivePromise = new Promise((resolve) => {
      subscribeToChannel(channel, (message) => {
        resolve(message);
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 150));

    await publishMessage(channel, text);
    const receivedPayload = await receivePromise;
    
    expect(receivedPayload).toBe(text);

    await unsubscribeFromChannel(channel);
  });
});
