import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type ServiceDefinition,
} from "../../../domain/catalogTypes.ts";
import type { ServiceId } from "../../../domain/serviceId.ts";
import { randomAlnum12 } from "../../randomNodeDefaults.ts";

export const snsStandardTopicNodeConfigSchema = z
  .object({
    name: z.string(),
  })
  .superRefine((data, ctx) => {
    const t = data.name.trim();
    if (t.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Topic name is required.",
        path: ["name"],
      });
      return;
    }
    if (t.endsWith(".fifo")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Standard topic names must not end with .fifo.",
        path: ["name"],
      });
      return;
    }
    if (t.length > 256) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Topic name must be at most 256 characters.",
        path: ["name"],
      });
      return;
    }
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(t)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use letters, numbers, hyphens, and underscores.",
        path: ["name"],
      });
    }
  });

export const snsStandardServiceDefinition: ServiceDefinition = {
  id: "sns_standard" satisfies ServiceId,
  version: DEFINITION_VERSION_V1,
  displayName: "SNS (standard)",
  description:
    "Standard SNS topic with AWS-managed encryption (alias/aws/sns).",
  configSchema: snsStandardTopicNodeConfigSchema,
  createDefaultConfig: () => ({ name: `topic-${randomAlnum12()}` }),
};
