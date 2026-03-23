import { z } from "zod";

import {
  SERVICE_VERSION,
  type ServiceDefinition,
} from "../../domain/catalogTypes.ts";
import type { ServiceId } from "../../domain/serviceId.ts";

function normalizeZoneName(z: string): string {
  return z.replace(/\.$/, "").toLowerCase();
}

function normalizeFqdn(d: string): string {
  return d.replace(/\.$/, "").toLowerCase();
}

/**
 * Draft-friendly: empty strings are allowed until the user fills the form.
 * Graph validation requires all fields when a `route53_alias_cloudfront` edge uses this node.
 */
export const route53NodeConfigSchema = z
  .object({
    domainName: z.string().default(""),
    zoneName: z.string().default(""),
    hostedZoneId: z.string().default(""),
    certificateArn: z.string().default(""),
  })
  .superRefine((data, ctx) => {
    const d = data.domainName.trim();
    const zname = data.zoneName.trim();
    if (d === "" || zname === "") return;

    const zone = normalizeZoneName(zname);
    const fqdn = normalizeFqdn(d);
    if (fqdn === zone) return;
    const suffix = `.${zone}`;
    if (fqdn.endsWith(suffix)) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Domain name must equal the zone name (apex) or be a subdomain of "${zone}".`,
      path: ["domainName"],
    });
  });

export const route53ServiceDefinition: ServiceDefinition = {
  id: "route53" satisfies ServiceId,
  version: SERVICE_VERSION,
  displayName: "Route 53",
  description: "Route 53 alias to CloudFront with custom hostname and ACM certificate.",
  configSchema: route53NodeConfigSchema,
};

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
