import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export async function healthRoutes(fastify: FastifyInstance) {
  /**
   * GET /health
   * Health check endpoint
   */
  fastify.get("/health", async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });
}
