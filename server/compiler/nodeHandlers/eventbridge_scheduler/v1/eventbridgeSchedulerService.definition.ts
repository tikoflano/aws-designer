import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type ServiceDefinition,
} from "../../../domain/catalogTypes.ts";
import type { ServiceId } from "../../../domain/serviceId.ts";
import { randomAlnum12 } from "../../randomNodeDefaults.ts";

const scheduleNameRegex = /^[a-zA-Z0-9_.-]+$/;

export function isValidIanaTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function rateToWholeMinutes(value: number, unit: "minute" | "hour" | "day"): number {
  switch (unit) {
    case "minute":
      return value;
    case "hour":
      return value * 60;
    case "day":
      return value * 24 * 60;
    default:
      return 0;
  }
}

export const eventbridgeSchedulerNodeConfigSchema = z
  .object({
    scheduleName: z
      .string()
      .min(1, { message: "Schedule name is required." })
      .max(64, { message: "Schedule name must be at most 64 characters." })
      .regex(scheduleNameRegex, {
        message: "Use only letters, numbers, hyphens, underscores, and dots.",
      }),
    description: z
      .string()
      .max(512, { message: "Description must be at most 512 characters." })
      .default(""),
    enabled: z.boolean().default(true),
    scheduleKind: z.enum(["rate", "cron", "at", "custom"]),
    rateValue: z.number().int().positive().optional(),
    rateUnit: z.enum(["minute", "hour", "day"]).optional(),
    timezone: z.string().optional(),
    cronMinute: z.string().default("*"),
    cronHour: z.string().default("*"),
    cronDay: z.string().default("*"),
    cronMonth: z.string().default("*"),
    cronWeekDay: z.string().default("*"),
    cronYear: z.string().optional(),
    atIso: z.string().optional(),
    customExpression: z.string().optional(),
    flexibleWindowMode: z.enum(["off", "flexible"]).default("off"),
    flexibleWindowMaxMinutes: z.number().int().min(1).max(1440).optional(),
    startDateIso: z.string().optional(),
    endDateIso: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.flexibleWindowMode === "flexible") {
      if (
        data.flexibleWindowMaxMinutes === undefined ||
        data.flexibleWindowMaxMinutes < 1 ||
        data.flexibleWindowMaxMinutes > 1440
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Flexible window requires maximum window minutes between 1 and 1440.",
          path: ["flexibleWindowMaxMinutes"],
        });
      }
    }

    if (data.startDateIso !== undefined && data.startDateIso.trim() !== "") {
      const d = new Date(data.startDateIso);
      if (Number.isNaN(d.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date must be a valid ISO 8601 date-time.",
          path: ["startDateIso"],
        });
      }
    }
    if (data.endDateIso !== undefined && data.endDateIso.trim() !== "") {
      const d = new Date(data.endDateIso);
      if (Number.isNaN(d.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be a valid ISO 8601 date-time.",
          path: ["endDateIso"],
        });
      }
    }

    const start =
      data.startDateIso !== undefined && data.startDateIso.trim() !== ""
        ? new Date(data.startDateIso)
        : undefined;
    const end =
      data.endDateIso !== undefined && data.endDateIso.trim() !== ""
        ? new Date(data.endDateIso)
        : undefined;
    if (
      start !== undefined &&
      end !== undefined &&
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      start >= end
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date must be before end date.",
        path: ["endDateIso"],
      });
    }

    switch (data.scheduleKind) {
      case "rate": {
        if (data.rateValue === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Rate value is required.",
            path: ["rateValue"],
          });
          return;
        }
        if (data.rateUnit === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Rate unit is required.",
            path: ["rateUnit"],
          });
          return;
        }
        const mins = rateToWholeMinutes(data.rateValue, data.rateUnit);
        if (mins < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Rate must be at least one minute when converted to minutes.",
            path: ["rateValue"],
          });
        }
        break;
      }
      case "cron": {
        const tz = data.timezone?.trim() ?? "";
        if (tz === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Timezone is required for cron schedules (IANA name, e.g. America/New_York).",
            path: ["timezone"],
          });
          return;
        }
        if (!isValidIanaTimeZone(tz)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unknown IANA timezone "${tz}".`,
            path: ["timezone"],
          });
        }
        break;
      }
      case "at": {
        const iso = data.atIso?.trim() ?? "";
        if (iso === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "One-time schedule requires a date and time (ISO 8601).",
            path: ["atIso"],
          });
          return;
        }
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "One-time schedule must be a valid ISO 8601 date-time.",
            path: ["atIso"],
          });
          return;
        }
        const tz = data.timezone?.trim() ?? "";
        if (tz === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Timezone is required for one-time schedules (IANA name).",
            path: ["timezone"],
          });
          return;
        }
        if (!isValidIanaTimeZone(tz)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unknown IANA timezone "${tz}".`,
            path: ["timezone"],
          });
        }
        break;
      }
      case "custom": {
        const ex = data.customExpression?.trim() ?? "";
        if (ex === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Custom schedule expression is required (e.g. cron(...) or rate(...)).",
            path: ["customExpression"],
          });
          return;
        }
        const tz = data.timezone?.trim();
        if (tz !== undefined && tz !== "" && !isValidIanaTimeZone(tz)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unknown IANA timezone "${tz}".`,
            path: ["timezone"],
          });
        }
        break;
      }
      default:
        break;
    }
  });

export type EventbridgeSchedulerNodeConfig = z.infer<
  typeof eventbridgeSchedulerNodeConfigSchema
>;

export const eventbridgeSchedulerServiceDefinition: ServiceDefinition = {
  id: "eventbridge_scheduler" satisfies ServiceId,
  version: DEFINITION_VERSION_V1,
  displayName: "EventBridge Scheduler",
  description:
    "Run on a rate, cron, one-time, or custom schedule; connect to Lambda, SQS, or SNS as the target (default schedule group, AWS-managed encryption).",
  configSchema: eventbridgeSchedulerNodeConfigSchema,
  createDefaultConfig: () => ({
    scheduleName: `sched-${randomAlnum12()}`,
    description: "",
    enabled: true,
    scheduleKind: "rate",
    rateValue: 5,
    rateUnit: "minute",
    timezone: "UTC",
    cronMinute: "0",
    cronHour: "*",
    cronDay: "*",
    cronMonth: "*",
    cronWeekDay: "?",
    cronYear: "",
    atIso: "",
    customExpression: "",
    flexibleWindowMode: "off",
    flexibleWindowMaxMinutes: 15,
    startDateIso: "",
    endDateIso: "",
  }),
};
