import { z } from "zod";

function refineOptionalJsonInput(data: { input: string }, ctx: z.RefinementCtx): void {
  const t = data.input.trim();
  if (t === "") return;
  try {
    JSON.parse(t) as unknown;
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Input must be empty or valid JSON.",
      path: ["input"],
    });
  }
}

/** Optional JSON payload for Lambda / SNS scheduler targets. */
export const eventbridgeSchedulerTargetInputSchema = z
  .object({
    input: z.string().default(""),
  })
  .superRefine(refineOptionalJsonInput);

/** SQS target: optional JSON body + optional FIFO message group id (required for FIFO queues at validateGraph time). */
export const eventbridgeSchedulerSqsTargetSchema = z
  .object({
    input: z.string().default(""),
    messageGroupId: z.string().max(128).default(""),
  })
  .superRefine(refineOptionalJsonInput)
  .superRefine((data, ctx) => {
    const g = data.messageGroupId.trim();
    if (g === "") return;
    if (g.length < 1 || g.length > 128) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Message group ID must be 1–128 characters when set.",
        path: ["messageGroupId"],
      });
    }
  });
