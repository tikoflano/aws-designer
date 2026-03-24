import { describe, expect, it } from "vitest";

import { ALL_RELATIONSHIPS } from "./relationshipsCatalog.ts";
import { edgeRelationshipHandlers } from "./registry.ts";

describe("relationship registry vs catalog", () => {
  it("has a handler for every catalog relationship id", () => {
    for (const r of ALL_RELATIONSHIPS) {
      expect(edgeRelationshipHandlers[r.id]).toBeDefined();
    }
  });

  it("has no handler ids outside the catalog", () => {
    const catalogIds = new Set(ALL_RELATIONSHIPS.map((r) => r.id));
    for (const id of Object.keys(edgeRelationshipHandlers)) {
      expect(catalogIds.has(id)).toBe(true);
    }
  });
});
