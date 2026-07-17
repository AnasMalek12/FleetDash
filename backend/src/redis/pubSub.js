import { getRedisClient, getSubscriberClient } from "./redisClient.js";

/**
 * Publishes a message to a Redis Pub/Sub channel.
 * Automatically serializes objects/arrays to JSON string.
 * @param {string} channel - The Pub/Sub channel name.
 * @param {any} payload - The message payload to publish.
 * @returns {Promise<number>} Resolves with the number of clients that received the message.
 */
export async function publishMessage(channel, payload) {
  try {
    const client = getRedisClient();
    const message = typeof payload === "string" ? payload : JSON.stringify(payload);
    
    // publish returns the number of subscribers that received the message
    const subscribersCount = await client.publish(channel, message);
    return subscribersCount;
  } catch (error) {
    console.error(`🔴 Error publishing message to channel "${channel}":`, error.message || error);
    throw error;
  }
}

/**
 * Subscribes to a Redis Pub/Sub channel.
 * Automatically parses incoming JSON string messages.
 * @param {string} channel - The Pub/Sub channel name.
 * @param {function} callback - Callback function invoked with the parsed message payload.
 */
export async function subscribeToChannel(channel, callback) {
  try {
    const subscriber = getSubscriberClient();

    await subscriber.subscribe(channel, (message) => {
      let parsedPayload = message;
      try {
        parsedPayload = JSON.parse(message);
      } catch {
        // Fallback to raw string message if not JSON
      }
      callback(parsedPayload);
    });

    console.log(`📡 Successfully subscribed to Redis channel: "${channel}"`);
  } catch (error) {
    console.error(`🔴 Error subscribing to channel "${channel}":`, error.message || error);
    throw error;
  }
}

/**
 * Unsubscribes from a Redis Pub/Sub channel.
 * @param {string} channel - The Pub/Sub channel name.
 */
export async function unsubscribeFromChannel(channel) {
  try {
    const subscriber = getSubscriberClient();
    await subscriber.unsubscribe(channel);
    console.log(`📴 Unsubscribed from Redis channel: "${channel}"`);
  } catch (error) {
    console.error(`🔴 Error unsubscribing from channel "${channel}":`, error.message || error);
    throw error;
  }
}
