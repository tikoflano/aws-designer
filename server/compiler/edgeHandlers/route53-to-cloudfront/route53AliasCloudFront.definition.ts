import { z } from "zod";

import {
  RELATIONSHIP_VERSION,
  type RelationshipDefinition,
} from "../../domain/catalogTypes.ts";

export const route53AliasCloudFrontConfigSchema = z.object({
  domainName: z.string().default(""),
  hostedZoneId: z.string().default(""),
  certificateArn: z.string().default(""),
});

export const route53AliasCloudFrontDefinition: RelationshipDefinition = {
  id: "route53_alias_cloudfront",
  version: RELATIONSHIP_VERSION,
  name: "Route 53 alias to CloudFront",
  description:
    "Creates an alias A record, attaches the domain to the distribution, and sets the ACM viewer certificate (certificate must be in us-east-1).",
  source: "route53",
  target: "cloudfront",
  configSchema: route53AliasCloudFrontConfigSchema,
};
