import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedisClient } from "../redis/redisClient.js";

let io = null;
let adapterPubClient = null;
let adapterSubClient = null;

/**
 * Initializes the Socket.io server attached to the provided HTTP server.
 * Integrates @socket.io/redis-adapter for horizontal scaling if Redis client is available.
 *
 * @param {import("http").Server} httpServer
 * @param {object} [options]
 * @returns {Promise<Server>}
 */
export async function initSocketServer(httpServer, options = {}) {
  const corsOptions = options.cors || {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  };

  io = new Server(httpServer, {
    cors: corsOptions,
    transports: ["websocket", "polling"],
    ...options,
  });

  // Attach Redis adapter if Redis client is initialized
  try {
    const mainClient = getRedisClient();
    if (mainClient && mainClient.isOpen) {
      adapterPubClient = mainClient.duplicate();
      adapterSubClient = mainClient.duplicate();

      adapterPubClient.on("error", (err) => {
        console.error("🔴 Socket.io Redis Adapter PubClient error:", err.message || err);
      });
      adapterSubClient.on("error", (err) => {
        console.error("🔴 Socket.io Redis Adapter SubClient error:", err.message || err);
      });

      await Promise.all([adapterPubClient.connect(), adapterSubClient.connect()]);

      io.adapter(createAdapter(adapterPubClient, adapterSubClient));
      console.log("⚡ Socket.io Redis adapter initialized successfully.");
    }
  } catch (err) {
    console.warn(
      "⚠️ Redis client not available for Socket.io adapter. Falling back to default in-memory adapter:",
      err.message || err
    );
  }

  // Socket Connection and Event Handlers
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected to Socket.io: ${socket.id}`);

    // Join/Leave Fleet Room
    socket.on("subscribe:fleet", () => {
      socket.join("fleet");
      console.log(`📡 Client ${socket.id} subscribed to fleet updates.`);
      socket.emit("subscribed", { room: "fleet", status: "success" });
    });

    socket.on("unsubscribe:fleet", () => {
      socket.leave("fleet");
      console.log(`📴 Client ${socket.id} unsubscribed from fleet updates.`);
      socket.emit("unsubscribed", { room: "fleet", status: "success" });
    });

    // Join/Leave Specific Vehicle Room
    socket.on("subscribe:vehicle", (vehicleId) => {
      if (!vehicleId) return;
      const room = `vehicle:${vehicleId}`;
      socket.join(room);
      console.log(`📡 Client ${socket.id} subscribed to ${room}`);
      socket.emit("subscribed", { room, status: "success" });
    });

    socket.on("unsubscribe:vehicle", (vehicleId) => {
      if (!vehicleId) return;
      const room = `vehicle:${vehicleId}`;
      socket.leave(room);
      console.log(`📴 Client ${socket.id} unsubscribed from ${room}`);
      socket.emit("unsubscribed", { room, status: "success" });
    });

    // General Room Join/Leave
    socket.on("join:room", (room) => {
      if (!room) return;
      socket.join(room);
      console.log(`📡 Client ${socket.id} joined room ${room}`);
      socket.emit("joined", { room, status: "success" });
    });

    socket.on("leave:room", (room) => {
      if (!room) return;
      socket.leave(room);
      console.log(`📴 Client ${socket.id} left room ${room}`);
      socket.emit("left", { room, status: "success" });
    });

    // Handle Client Telemetry Update Broadcasting
    socket.on("telemetry:update", (data) => {
      if (!data) return;
      const vehicleId = data.vehicleId || data.id;
      // Broadcast to fleet room
      io.to("fleet").emit("telemetry:update", data);
      // Broadcast to vehicle room if vehicleId present
      if (vehicleId) {
        io.to(`vehicle:${vehicleId}`).emit("telemetry:update", data);
      }
    });

    // Disconnect event
    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
}

/**
 * Returns the active Socket.io instance.
 * @returns {Server}
 */
export function getIO() {
  if (!io) {
    throw new Error("Socket.io has not been initialized. Call initSocketServer(httpServer) first.");
  }
  return io;
}

/**
 * Broadcasts an event and data payload to all clients in the 'fleet' room.
 * @param {string} event
 * @param {any} data
 */
export function emitToFleet(event, data) {
  if (io) {
    io.to("fleet").emit(event, data);
  }
}

/**
 * Broadcasts an event and data payload to a specific vehicle room ('vehicle:<vehicleId>').
 * @param {string} vehicleId
 * @param {string} event
 * @param {any} data
 */
export function emitToVehicle(vehicleId, event, data) {
  if (io && vehicleId) {
    io.to(`vehicle:${vehicleId}`).emit(event, data);
  }
}

/**
 * Gracefully shuts down the Socket.io server and cleans up Redis adapter connections.
 */
export async function closeSocketServer() {
  if (io) {
    await new Promise((resolve) => io.close(resolve));
    io = null;
  }

  const disconnectTasks = [];
  if (adapterPubClient && adapterPubClient.isOpen) {
    disconnectTasks.push(
      adapterPubClient.disconnect().catch((err) => console.error("Error closing adapterPubClient:", err.message))
    );
  }
  if (adapterSubClient && adapterSubClient.isOpen) {
    disconnectTasks.push(
      adapterSubClient.disconnect().catch((err) => console.error("Error closing adapterSubClient:", err.message))
    );
  }

  await Promise.all(disconnectTasks);
  adapterPubClient = null;
  adapterSubClient = null;
  console.log("👋 Socket.io server and adapter clients closed.");
}
