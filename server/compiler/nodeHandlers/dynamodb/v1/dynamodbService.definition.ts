import { z } from "zod";

import {
  SERVICE_VERSION,
  type ServiceDefinition,
} from "../../domain/catalogTypes.ts";
import type { ServiceId } from "../../domain/serviceId.ts";

const attrName = z
  .string()
  .min(1, { message: "Attribute name is required." })
  .max(255, { message: "Attribute name must be at most 255 characters." })
  .regex(/^[a-zA-Z0-9_.-]+$/, {
    message: "Use only letters, numbers, and _ . - for attribute names.",
  });

const tableNameRules = z
  .string()
  .min(3, { message: "Table name must be at least 3 characters." })
  .max(255, { message: "Table name must be at most 255 characters." })
  .regex(/^[a-zA-Z0-9_.-]+$/, {
    message: "Use only letters, numbers, and _ . - for the table name.",
  });

const keyTypeSchema = z.enum(["string", "number", "binary"]);

export const dynamodbTableNodeConfigSchema = z
  .object({
    name: z.string().default(""),
    partitionKeyName: z.string().default("pk"),
    partitionKeyType: keyTypeSchema.default("string"),
    sortKeyName: z.string().default(""),
    sortKeyType: keyTypeSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const n = data.name.trim();
    if (n === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Table name is required.",
        path: ["name"],
      });
      return;
    }
    const tn = tableNameRules.safeParse(n);
    if (!tn.success) {
      for (const issue of tn.error.issues) {
        ctx.addIssue({ ...issue, path: ["name"] });
      }
    }

    const pk = data.partitionKeyName.trim();
    if (pk === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Partition key name is required.",
        path: ["partitionKeyName"],
      });
    } else {
      const pkParsed = attrName.safeParse(pk);
      if (!pkParsed.success) {
        for (const issue of pkParsed.error.issues) {
          ctx.addIssue({ ...issue, path: ["partitionKeyName"] });
        }
      }
    }

    const sk = data.sortKeyName.trim();
    if (sk !== "") {
      const skParsed = attrName.safeParse(sk);
      if (!skParsed.success) {
        for (const issue of skParsed.error.issues) {
          ctx.addIssue({ ...issue, path: ["sortKeyName"] });
        }
      }
      if (data.sortKeyType === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sort key type is required when a sort key is set.",
          path: ["sortKeyType"],
        });
      }
    }
  })
  .transform((data) => {
    const sortKeyName = data.sortKeyName.trim();
    return {
      name: data.name.trim(),
      partitionKeyName: data.partitionKeyName.trim(),
      partitionKeyType: data.partitionKeyType,
      ...(sortKeyName !== "" && data.sortKeyType !== undefined
        ? {
            sortKeyName,
            sortKeyType: data.sortKeyType,
          }
        : {}),
    };
  });

export type DynamodbTableNodeConfig = z.infer<typeof dynamodbTableNodeConfigSchema>;

export const dynamodbServiceDefinition: ServiceDefinition = {
  id: "dynamodb" satisfies ServiceId,
  version: SERVICE_VERSION,
  displayName: "DynamoDB",
  description:
    "Single-table design with partition key and optional sort key; on-demand capacity and AWS-managed encryption.",
  configSchema: dynamodbTableNodeConfigSchema,
};
