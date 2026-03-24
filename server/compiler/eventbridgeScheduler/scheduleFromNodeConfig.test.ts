import { describe, expect, it } from "vitest";

import {
  eventbridgeSchedulerNodeConfigSchema,
  eventbridgeSchedulerServiceDefinition,
} from "../nodeHandlers/eventbridge_scheduler/v1/eventbridgeSchedulerService.definition.ts";

import { scheduleTimingFromNodeConfig } from "./scheduleFromNodeConfig.ts";

describe("scheduleTimingFromNodeConfig", () => {
  it("builds a rate expression", () => {
    const cfg = eventbridgeSchedulerNodeConfigSchema.parse({
      ...eventbridgeSchedulerServiceDefinition.createDefaultConfig(),
      scheduleKind: "rate",
      rateValue: 10,
      rateUnit: "minute",
    });
    const { schedule, timeWindow } = scheduleTimingFromNodeConfig(cfg);
    expect(schedule.expressionString).toMatch(/rate\s*\(\s*10\s+minute/);
    expect(timeWindow.mode).toBe("OFF");
  });

  it("builds cron with timezone", () => {
    const cfg = eventbridgeSchedulerNodeConfigSchema.parse({
      ...eventbridgeSchedulerServiceDefinition.createDefaultConfig(),
      scheduleKind: "cron",
      timezone: "UTC",
      cronMinute: "0",
      cronHour: "12",
      cronDay: "*",
      cronMonth: "*",
      cronWeekDay: "?",
    });
    const { schedule } = scheduleTimingFromNodeConfig(cfg);
    expect(schedule.expressionString).toContain("cron");
    expect(schedule.timeZone?.timezoneName).toBe("UTC");
  });

  it("applies flexible time window", () => {
    const cfg = eventbridgeSchedulerNodeConfigSchema.parse({
      ...eventbridgeSchedulerServiceDefinition.createDefaultConfig(),
      scheduleKind: "rate",
      rateValue: 1,
      rateUnit: "hour",
      flexibleWindowMode: "flexible",
      flexibleWindowMaxMinutes: 30,
    });
    const { timeWindow } = scheduleTimingFromNodeConfig(cfg);
    expect(timeWindow.mode).toBe("FLEXIBLE");
    expect(timeWindow.maxWindow?.toMinutes()).toBe(30);
  });
});
