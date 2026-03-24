import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type ServiceDefinition,
} from "../../../domain/catalogTypes.ts";
import type { ServiceId } from "../../../domain/serviceId.ts";
import { randomAlnum12 } from "../../randomNodeDefaults.ts";

export const sqsQueueTypeSchema = z.enum(["standard", "fifo"]);

export const sqsQueueNodeConfigSchema = z
  .object({
    name: z.string(),
    queueType: sqsQueueTypeSchema.default("standard"),
  })
  .superRefine((data, ctx) => {
    const t = data.name.trim();
    if (t.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Queue name is required.",
        path: ["name"],
      });
      return;
    }

    if (data.queueType === "fifo") {
      if (t.endsWith(".fifo")) {
        if (t.length > 80) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "FIFO queue name must be at most 80 characters.",
            path: ["name"],
          });
          return;
        }
        if (!/^[A-Za-z0-9][A-Za-z0-9_-]*\.fifo$/.test(t)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Use letters, numbers, hyphens, underscores; FIFO names end with .fifo.",
            path: ["name"],
          });
        }
      } else {
        if (t.length > 75) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Name must be at most 75 characters (.fifo is appended automatically).",
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
    } else {
      if (t.endsWith(".fifo")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Standard queue names must not end with .fifo.",
          path: ["name"],
        });
        return;
      }
      if (t.length > 80) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Queue name must be at most 80 characters.",
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

export const sqsServiceDefinition: ServiceDefinition = {
  id: "sqs" satisfies ServiceId,
  version: DEFINITION_VERSION_V1,
  displayName: "SQS queue",
  description:
    "Standard or FIFO queue with SSE-SQS, 4-day retention, 30s visibility, 1024 KiB max message, and an auto-created DLQ (max receives 10).",
  configSchema: sqsQueueNodeConfigSchema,
  createDefaultConfig: () => ({
    name: `q-${randomAlnum12()}`,
    queueType: "standard",
  }),
};
