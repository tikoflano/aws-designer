import { describe, expect, it } from "vitest";

import { SERVICE_ID_VALUES } from "../domain/serviceId.ts";
import { listServices } from "./servicesCatalog.ts";

describe("servicesCatalog", () => {
  it("lists every SERVICE_ID_VALUES id exactly once in palette order", () => {
    const listed = listServices().map((s) => s.id);
    expect(listed).toEqual([...SERVICE_ID_VALUES]);
  });
});
