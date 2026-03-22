import cors from "@fastify/cors";
import Fastify from "fastify";

import "./db.js";
import type { GraphDocument } from "../../src/domain/types.ts";
import {
  appendVersion,
  createGraph,
  deleteGraph,
  getGraphVersion,
  getLatestGraph,
  graphExists,
  listGraphSummaries,
  listGraphVersions,
  type GraphRow,
} from "./graphRepo.js";
import { synthGraphToZipBuffer } from "./synthZip.js";

function formatResponse(row: GraphRow) {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    version: row.version,
    graph: row.graph,
  };
}

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

app.get("/health", async () => ({ ok: true }));

await app.register(
  async (r) => {
    r.get("/graphs", async (_req, reply) => {
      return reply.send({ graphs: listGraphSummaries() });
    });

    r.post("/graph", async (_req, reply) => {
      const row = createGraph();
      return reply
        .code(201)
        .header("Location", `/api/graph/${row.id}`)
        .send(formatResponse(row));
    });

    r.get("/graph/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const row = getLatestGraph(id);
      if (!row) return reply.code(404).send({ error: "not_found" });
      return reply.send(formatResponse(row));
    });

    r.put("/graph/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = req.body as { graph?: GraphDocument };
      if (
        !body?.graph ||
        !Array.isArray(body.graph.nodes) ||
        !Array.isArray(body.graph.edges)
      ) {
        return reply.code(400).send({
          error: "invalid_body",
          message: "Expected { graph: { nodes, edges } }",
        });
      }
      const row = appendVersion(id, body.graph);
      if (!row) return reply.code(404).send({ error: "not_found" });
      return reply.send(formatResponse(row));
    });

    r.delete("/graph/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const ok = deleteGraph(id);
      if (!ok) return reply.code(404).send({ error: "not_found" });
      return reply.code(204).send();
    });

    r.get("/graph/:id/versions", async (req, reply) => {
      const { id } = req.params as { id: string };
      if (!graphExists(id)) return reply.code(404).send({ error: "not_found" });
      return reply.send({ versions: listGraphVersions(id) });
    });

    r.get("/graph/:id/versions/:versionId", async (req, reply) => {
      const { id, versionId } = req.params as { id: string; versionId: string };
      const vid = parseInt(versionId, 10);
      if (Number.isNaN(vid)) {
        return reply.code(400).send({ error: "invalid_version" });
      }
      const row = getGraphVersion(id, vid);
      if (!row) return reply.code(404).send({ error: "not_found" });
      return reply.send(formatResponse(row));
    });

    r.get("/graph/:id/compiled", async (req, reply) => {
      const { id } = req.params as { id: string };
      const row = getLatestGraph(id);
      if (!row) return reply.code(404).send({ error: "not_found" });
      const zip = await synthGraphToZipBuffer(row.graph);
      if (!zip.ok) {
        return reply
          .code(422)
          .send({ error: "validation_failed", issues: zip.issues });
      }
      return reply
        .type("application/zip")
        .header(
          "Content-Disposition",
          `attachment; filename="graph-${id}-cdk-out.zip"`,
        )
        .send(zip.buffer);
    });
  },
  { prefix: "/api" },
);

const port = Number(process.env.PORT) || 8787;
const host = process.env.HOST ?? "0.0.0.0";
await app.listen({ port, host });
app.log.info(`Listening on http://${host}:${port} (API under /api)`);
