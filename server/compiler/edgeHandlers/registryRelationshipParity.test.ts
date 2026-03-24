import { describe, expect, it } from "vitest";

import { ALL_RELATIONSHIPS } from "./relationshipsCatalog.ts";
import { getEdgeHandler, listEdgeRelationshipHandlers } from "./registry.ts";

describe("relationship registry vs catalog", () => {
  it("has a handler for every catalog relationship id and version", () => {
    for (const r of ALL_RELATIONSHIPS) {
      expect(getEdgeHandler(r.id, r.version)).toBeDefined();
    }
  });

  it("has the same number of handlers as catalog entries", () => {
    expect(listEdgeRelationshipHandlers()).toHaveLength(ALL_RELATIONSHIPS.length);
  });

  it("has no handler definitions outside the catalog", () => {
    const catalogKeys = new Set(
      ALL_RELATIONSHIPS.map((r) => `${r.id}@${String(r.version)}`),
    );
    for (const h of listEdgeRelationshipHandlers()) {
      const key = `${h.definition.id}@${String(h.definition.version)}`;
      expect(catalogKeys.has(key)).toBe(true);
    }
  });
});
