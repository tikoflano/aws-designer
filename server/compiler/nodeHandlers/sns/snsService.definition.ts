import { z } from "zod";

import {
  SERVICE_VERSION,
  type ServiceDefinition,
} from "../../domain/catalogTypes.ts";
import type { ServiceId } from "../../domain/serviceId.ts";

const snsTopicNameSchema = z
  .string()
  .transform((s) => s.trim())
  .superRefine((t, ctx) => {
    if (t.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Topic name is required.",
      });
      return;
    }
    if (t.endsWith(".fifo")) {
      if (t.length > 256) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "FIFO topic name must be at most 256 characters.",
        });
        return;
      }
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]*\.fifo$/.test(t)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Use letters, numbers, hyphens, and underscores; name must end with .fifo.",
        });
      }
    } else {
      if (t.length > 249) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Name must be at most 249 characters (.fifo is appended automatically).",
        });
        return;
      }
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(t)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use letters, numbers, hyphens, and underscores.",
        });
      }
    }
  });

export const snsTopicNodeConfigSchema = z.object({
  name: snsTopicNameSchema,
});

export const snsServiceDefinition: ServiceDefinition = {
  id: "sns" satisfies ServiceId,
  version: SERVICE_VERSION,
  displayName: "SNS topic",
  description:
    "FIFO SNS topic (topic-scope throughput, content-based deduplication, AWS-managed encryption).",
  configSchema: snsTopicNodeConfigSchema,
};
