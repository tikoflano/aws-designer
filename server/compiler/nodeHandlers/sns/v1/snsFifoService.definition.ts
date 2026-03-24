import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type ServiceDefinition,
} from "../../../domain/catalogTypes.ts";
import type { ServiceId } from "../../../domain/serviceId.ts";

export const snsFifoThroughputScopeSchema = z.enum(["message_group", "topic"]);

export const snsFifoTopicNodeConfigSchema = z
  .object({
    name: z.string(),
    fifoThroughputScope: snsFifoThroughputScopeSchema.default("message_group"),
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
      if (t.length > 256) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "FIFO topic name must be at most 256 characters.",
          path: ["name"],
        });
        return;
      }
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]*\.fifo$/.test(t)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Use letters, numbers, hyphens, and underscores; FIFO names end with .fifo.",
          path: ["name"],
        });
      }
    } else {
      if (t.length > 249) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Name must be at most 249 characters (.fifo is appended automatically).",
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
    }
  });

export const snsFifoServiceDefinition: ServiceDefinition = {
  id: "sns_fifo" satisfies ServiceId,
  version: DEFINITION_VERSION_V1,
  displayName: "SNS (FIFO)",
  description:
    "FIFO SNS topic: topic- or message-group-scope throughput, content-based deduplication, AWS-managed encryption.",
  configSchema: snsFifoTopicNodeConfigSchema,
};
