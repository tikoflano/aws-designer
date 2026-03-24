import { ScheduleTargetInput } from "aws-cdk-lib/aws-scheduler";

/** @returns undefined when the payload is empty after trim. */
export function scheduleTargetInputFromJsonString(raw: string): ScheduleTargetInput | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  return ScheduleTargetInput.fromObject(JSON.parse(t) as object);
}
