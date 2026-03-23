import cors from "@fastify/cors";
import Fastify from "fastify";

import "./db.js";
import { apiPaths } from "@shared/api/paths.ts";
import {
  graphsListResponseSchema,
  graphVersionsListResponseSchema,
  invalidBodyErrorSchema,
  invalidVersionErrorSchema,
  notFoundErrorSchema,
  patchGraphTitleBodySchema,
  putGraphBodySchema,
  validationFailedErrorSchema,
  type GraphRecord,
} from "@shared/api/schemas.ts";
import {
  appendVersion,
  createGraph,
  deleteGraph,
  getGraphVersion,
  getLatestGraph,
  graphExists,
  listGraphSummaries,
  listGraphVersions,
  updateGraphTitle,
  type GraphRow,
} from "./graphRepo.js";
import { synthGraphToZipBuffer } from "./synthZip.js";

function formatResponse(row: GraphRow): GraphRecord {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    version: row.version,
    title: row.title,
    graph: row.graph,
  };
}

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

app.get("/health", async () => ({ ok: true }));

await app.register(
  async (r) => {
    r.get("/graphs", async (_req, reply) => {
      const payload = graphsListResponseSchema.parse({
        graphs: listGraphSummaries(),
      });
      return reply.send(payload);
    });

    r.post("/graph", async (_req, reply) => {
      const row = createGraph();
      return reply
        .code(201)
        .header("Location", apiPaths.graph(row.id))
        .send(formatResponse(row));
    });

    r.get("/graph/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const row = getLatestGraph(id);
      if (!row) {
        return reply.code(404).send(notFoundErrorSchema.parse({ error: "not_found" }));
      }
      return reply.send(formatResponse(row));
    });

    r.patch("/graph/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const parsed = patchGraphTitleBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(
          invalidBodyErrorSchema.parse({
            error: "invalid_body",
            message: "Expected { title: string } (max 200 characters)",
          }),
        );
      }
      const row = updateGraphTitle(id, parsed.data.title);
      if (!row) {
        return reply.code(404).send(notFoundErrorSchema.parse({ error: "not_found" }));
      }
      return reply.send(formatResponse(row));
    });

    r.put("/graph/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const parsed = putGraphBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(
          invalidBodyErrorSchema.parse({
            error: "invalid_body",
            message: "Expected { graph: { nodes, edges } }",
          }),
        );
      }
      const row = appendVersion(id, parsed.data.graph);
      if (!row) {
        return reply.code(404).send(notFoundErrorSchema.parse({ error: "not_found" }));
      }
      return reply.send(formatResponse(row));
    });

    r.delete("/graph/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const ok = deleteGraph(id);
      if (!ok) {
        return reply.code(404).send(notFoundErrorSchema.parse({ error: "not_found" }));
      }
      return reply.code(204).send();
    });

    r.get("/graph/:id/versions", async (req, reply) => {
      const { id } = req.params as { id: string };
      if (!graphExists(id)) {
        return reply.code(404).send(notFoundErrorSchema.parse({ error: "not_found" }));
      }
      const versionsPayload = graphVersionsListResponseSchema.parse({
        versions: listGraphVersions(id),
      });
      return reply.send(versionsPayload);
    });

    r.get("/graph/:id/versions/:versionId", async (req, reply) => {
      const { id, versionId } = req.params as { id: string; versionId: string };
      const vid = parseInt(versionId, 10);
      if (Number.isNaN(vid)) {
        return reply.code(400).send(
          invalidVersionErrorSchema.parse({ error: "invalid_version" }),
        );
      }
      const row = getGraphVersion(id, vid);
      if (!row) {
        return reply.code(404).send(notFoundErrorSchema.parse({ error: "not_found" }));
      }
      return reply.send(formatResponse(row));
    });

    r.get("/graph/:id/compiled", async (req, reply) => {
      const { id } = req.params as { id: string };
      const row = getLatestGraph(id);
      if (!row) {
        return reply.code(404).send(notFoundErrorSchema.parse({ error: "not_found" }));
      }
      const zip = await synthGraphToZipBuffer(row.graph);
      if (!zip.ok) {
        return reply.code(422).send(
          validationFailedErrorSchema.parse({
            error: "validation_failed",
            issues: zip.issues,
          }),
        );
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
