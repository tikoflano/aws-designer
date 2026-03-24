import { describe, expect, it } from "vitest";

import { ALL_SERVICES } from "./servicesCatalog.ts";
import { getNodeHandler, listNodeServiceHandlers } from "./registry.ts";

describe("node registry vs services catalog", () => {
  it("has a handler for every service id and definition version", () => {
    for (const s of ALL_SERVICES) {
      expect(getNodeHandler(s.id, s.version)).toBeDefined();
    }
  });

  it("has the same number of handlers as services", () => {
    expect(listNodeServiceHandlers()).toHaveLength(ALL_SERVICES.length);
  });

  it("has no handler definitions outside the catalog", () => {
    const catalogKeys = new Set(
      ALL_SERVICES.map((s) => `${s.id}@${String(s.version)}`),
    );
    for (const h of listNodeServiceHandlers()) {
      const key = `${h.definition.id}@${String(h.definition.version)}`;
      expect(catalogKeys.has(key)).toBe(true);
    }
  });
});
