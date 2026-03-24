import { z } from "zod";

const betweenSchema = z.object({
  start: z.number(),
  stop: z.number(),
});

/** Matches CDK `StringConditions` — at least one array must be non-empty when kind is string. */
export const snsSubscriptionStringLeafSchema = z.object({
  filterKind: z.literal("string"),
  allowlist: z.array(z.string()).optional(),
  denylist: z.array(z.string()).optional(),
  matchPrefixes: z.array(z.string()).optional(),
  matchSuffixes: z.array(z.string()).optional(),
});

/** Matches CDK `NumericConditions` — at least one condition when kind is numeric. */
export const snsSubscriptionNumericLeafSchema = z.object({
  filterKind: z.literal("numeric"),
  allowlist: z.array(z.number()).optional(),
  greaterThan: z.number().optional(),
  greaterThanOrEqualTo: z.number().optional(),
  lessThan: z.number().optional(),
  lessThanOrEqualTo: z.number().optional(),
  between: betweenSchema.optional(),
  betweenStrict: betweenSchema.optional(),
});

export const snsSubscriptionExistsLeafSchema = z.object({
  filterKind: z.literal("exists"),
});

export const snsSubscriptionNotExistsLeafSchema = z.object({
  filterKind: z.literal("notExists"),
});

export const snsSubscriptionLeafFilterSchema = z.discriminatedUnion("filterKind", [
  snsSubscriptionStringLeafSchema,
  snsSubscriptionNumericLeafSchema,
  snsSubscriptionExistsLeafSchema,
  snsSubscriptionNotExistsLeafSchema,
]);

function stringLeafHasCondition(
  v: z.infer<typeof snsSubscriptionStringLeafSchema>,
): boolean {
  return (
    (v.allowlist?.length ?? 0) > 0 ||
    (v.denylist?.length ?? 0) > 0 ||
    (v.matchPrefixes?.length ?? 0) > 0 ||
    (v.matchSuffixes?.length ?? 0) > 0
  );
}

function numericLeafHasCondition(
  v: z.infer<typeof snsSubscriptionNumericLeafSchema>,
): boolean {
  return (
    (v.allowlist?.length ?? 0) > 0 ||
    v.greaterThan !== undefined ||
    v.greaterThanOrEqualTo !== undefined ||
    v.lessThan !== undefined ||
    v.lessThanOrEqualTo !== undefined ||
    v.between !== undefined ||
    v.betweenStrict !== undefined
  );
}

export const snsSubscriptionLeafFilterSchemaWithLeafRules =
  snsSubscriptionLeafFilterSchema.superRefine((data, ctx) => {
    if (data.filterKind === "string" && !stringLeafHasCondition(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "String filter needs at least one of: allowlist, denylist, matchPrefixes, matchSuffixes (non-empty).",
        path: ["allowlist"],
      });
    }
    if (data.filterKind === "numeric" && !numericLeafHasCondition(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Numeric filter needs at least one condition.",
        path: ["allowlist"],
      });
    }
  });

const messageAttributeRuleSchema = z
  .object({
    attributeName: z
      .string()
      .min(1, "Attribute name is required")
      .transform((s) => s.trim()),
  })
  .and(snsSubscriptionLeafFilterSchemaWithLeafRules);

const messageBodyRuleSchema = z
  .object({
    fieldName: z
      .string()
      .min(1, "JSON field name is required")
      .transform((s) => s.trim()),
  })
  .and(snsSubscriptionLeafFilterSchemaWithLeafRules);

export const snsSubscriptionFilterSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("none") }),
    z.object({
      kind: z.literal("messageAttributes"),
      rules: z.array(messageAttributeRuleSchema).min(1, "Add at least one rule"),
    }),
    z.object({
      kind: z.literal("messageBody"),
      rules: z.array(messageBodyRuleSchema).min(1, "Add at least one rule"),
    }),
  ])
  .superRefine((data, ctx) => {
    if (data.kind === "messageAttributes") {
      const seen = new Set<string>();
      data.rules.forEach((r, i) => {
        const k = r.attributeName;
        if (seen.has(k)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate attribute name "${k}".`,
            path: ["rules", i, "attributeName"],
          });
        }
        seen.add(k);
      });
    }
    if (data.kind === "messageBody") {
      const seen = new Set<string>();
      data.rules.forEach((r, i) => {
        const k = r.fieldName;
        if (seen.has(k)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate JSON field name "${k}".`,
            path: ["rules", i, "fieldName"],
          });
        }
        seen.add(k);
      });
    }
  });

export type SnsSubscriptionFilter = z.infer<typeof snsSubscriptionFilterSchema>;
export type SnsSubscriptionLeafFilter = z.infer<
  typeof snsSubscriptionLeafFilterSchema
>;
