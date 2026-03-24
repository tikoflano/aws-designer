import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const route53AliasCloudFrontConfigSchema = z.object({
  domainName: z.string().default(""),
});

export const route53AliasCloudFrontDefinition: RelationshipDefinition = {
  id: "route53_alias_cloudfront",
  version: DEFINITION_VERSION_V1,
  name: "Route 53 alias to CloudFront",
  verb: "aliases",
  description:
    "Creates a DNS-validated ACM certificate (us-east-1), attaches the domain to the distribution, and adds a Route 53 alias record. The hosted zone is resolved from the Route 53 node zone name at deploy time (CDK lookup).",
  source: "route53",
  target: "cloudfront",
  configSchema: route53AliasCloudFrontConfigSchema,
};
