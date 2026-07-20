import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { connectRedis } from "./redis/redisClient.js";
import { initSocketServer } from "./socket/socketServer.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Connect to MongoDB and Redis first, initialize Socket.io server, then start listening
connectDB()
  .then(async () => {
    await connectRedis();
    await initSocketServer(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("🔴 Server initialization failed:", err.message || err);
    process.exit(1);
  });

