import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type ServiceDefinition,
} from "../../../domain/catalogTypes.ts";
import type { ServiceId } from "../../../domain/serviceId.ts";

export const route53ZoneType = z.enum(["public", "private"]);

export const route53NodeConfigSchema = z.object({
  name: z.string().default(""),
  type: route53ZoneType.default("public"),
});

export const route53ServiceDefinition: ServiceDefinition = {
  id: "route53" satisfies ServiceId,
  version: DEFINITION_VERSION_V1,
  displayName: "Route 53",
  description: "Route 53 hosted zone (public or private).",
  configSchema: route53NodeConfigSchema,
  createDefaultConfig: () => ({ name: "", type: "public" }),
};

function normalizeZoneName(z: string): string {
  return z.replace(/\.$/, "").toLowerCase();
}

function normalizeFqdn(d: string): string {
  return d.replace(/\.$/, "").toLowerCase();
}

/** Relative record name for ARecord, or undefined for zone apex. */
export function route53RecordNameFromDomain(
  domainName: string,
  zoneName: string,
): string | undefined {
  const zone = normalizeZoneName(zoneName);
  const fqdn = normalizeFqdn(domainName);
  if (fqdn === zone) return undefined;
  const suffix = `.${zone}`;
  if (!fqdn.endsWith(suffix)) return undefined;
  return fqdn.slice(0, -suffix.length);
}

export function domainInHostedZone(domainName: string, zoneName: string): boolean {
  const zone = normalizeZoneName(zoneName);
  const fqdn = normalizeFqdn(domainName);
  if (zone === "" || fqdn === "") return false;
  return fqdn === zone || fqdn.endsWith(`.${zone}`);
}
