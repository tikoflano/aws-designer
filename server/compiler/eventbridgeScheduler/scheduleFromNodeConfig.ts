import { Duration, TimeZone } from "aws-cdk-lib";
import { ScheduleExpression, TimeWindow } from "aws-cdk-lib/aws-scheduler";

import type { EventbridgeSchedulerNodeConfig } from "../nodeHandlers/eventbridge_scheduler/v1/eventbridgeSchedulerService.definition.ts";

function optionalBoundaryDate(iso: string | undefined): Date | undefined {
  if (iso === undefined || iso.trim() === "") return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Maps validated scheduler node config to CDK {@link Schedule} timing props.
 */
export function scheduleTimingFromNodeConfig(cfg: EventbridgeSchedulerNodeConfig): {
  schedule: ScheduleExpression;
  timeWindow: TimeWindow;
  start?: Date;
  end?: Date;
} {
  const timeWindow =
    cfg.flexibleWindowMode === "flexible" &&
    cfg.flexibleWindowMaxMinutes !== undefined
      ? TimeWindow.flexible(Duration.minutes(cfg.flexibleWindowMaxMinutes))
      : TimeWindow.off();

  let schedule: ScheduleExpression;
  switch (cfg.scheduleKind) {
    case "rate": {
      const v = cfg.rateValue!;
      const u = cfg.rateUnit!;
      const duration =
        u === "minute"
          ? Duration.minutes(v)
          : u === "hour"
            ? Duration.hours(v)
            : Duration.days(v);
      schedule = ScheduleExpression.rate(duration);
      break;
    }
    case "cron": {
      const tz = TimeZone.of(cfg.timezone!.trim());
      const w = cfg.cronWeekDay.trim();
      const d = cfg.cronDay.trim() || "*";
      // CDK/EventBridge: do not pass both `day` and `weekDay` — use `?` on one axis.
      if (w === "?" || w === "*" || w === "") {
        schedule = ScheduleExpression.cron({
          minute: cfg.cronMinute,
          hour: cfg.cronHour,
          day: d,
          month: cfg.cronMonth,
          year: cfg.cronYear,
          timeZone: tz,
        });
      } else {
        schedule = ScheduleExpression.cron({
          minute: cfg.cronMinute,
          hour: cfg.cronHour,
          weekDay: w,
          month: cfg.cronMonth,
          year: cfg.cronYear,
          timeZone: tz,
        });
      }
      break;
    }
    case "at": {
      schedule = ScheduleExpression.at(
        new Date(cfg.atIso!.trim()),
        TimeZone.of(cfg.timezone!.trim()),
      );
      break;
    }
    case "custom": {
      const tz = cfg.timezone?.trim();
      schedule = ScheduleExpression.expression(
        cfg.customExpression!.trim(),
        tz !== undefined && tz !== "" ? TimeZone.of(tz) : undefined,
      );
      break;
    }
  }

  return {
    schedule,
    timeWindow,
    start: optionalBoundaryDate(cfg.startDateIso),
    end: optionalBoundaryDate(cfg.endDateIso),
  };
}
