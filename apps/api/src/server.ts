import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env") });

import { authPlugin } from "./plugins/auth.js";
import { healthRoutes } from "./routes/health.js";
import { agentRoutes } from "./routes/agents.js";
import { jobRoutes } from "./routes/jobs.js";
import { bidRoutes } from "./routes/bids.js";
import { hireRoutes } from "./routes/hire.js";
import { completeRoutes } from "./routes/complete.js";
import { approveRoutes } from "./routes/approve.js";
import { historyRoutes } from "./routes/history.js";
import { messageRoutes } from "./routes/messages.js";

const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

// Register auth plugin (adds preHandler hook)
await fastify.register(authPlugin);

// Register routes
await fastify.register(healthRoutes);
await fastify.register(agentRoutes);
await fastify.register(jobRoutes);
await fastify.register(bidRoutes);
await fastify.register(hireRoutes);
await fastify.register(completeRoutes);
await fastify.register(approveRoutes);
await fastify.register(historyRoutes);
await fastify.register(messageRoutes);

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3001", 10);
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    console.log(`Server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export { fastify };
