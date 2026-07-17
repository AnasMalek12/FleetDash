import app from "./app.js";
import connectDB from "./config/db.js";
import { connectRedis } from "./redis/redisClient.js";

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and Redis first, then start server
connectDB()
  .then(async () => {
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("🔴 Server initialization failed:", err.message || err);
    process.exit(1);
  });
