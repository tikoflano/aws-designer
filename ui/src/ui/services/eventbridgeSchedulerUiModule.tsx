import { useWatch } from "react-hook-form";

import type { GraphNode } from "../../domain/types";
import { EventbridgeSchedulerCanvasNode } from "../flow/nodes/EventbridgeSchedulerCanvasNode";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import type { NodeInspectorFieldsProps, UiServiceModule } from "./types";

function canvasTitle(node: GraphNode): string {
  return String(
    (node.config.scheduleName as string | undefined)?.trim() || "Schedule",
  );
}

function EventbridgeSchedulerInspectorFields({
  formId,
  register,
  control,
  errors,
}: NodeInspectorFieldsProps) {
  const scheduleKind = useWatch({ control, name: "scheduleKind" });
  const flexibleMode = useWatch({ control, name: "flexibleWindowMode" });

  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Schedule name</span>
        <span className="text-xs text-slate-500">
          Up to 64 characters: letters, numbers, hyphens, underscores, dots.
        </span>
        <input
          className={`rounded border px-2 py-1 text-sm ${
            errors.scheduleName ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.scheduleName ? true : undefined}
          aria-describedby={
            errors.scheduleName?.message
              ? fieldErrorId(formId, "scheduleName")
              : undefined
          }
          {...register("scheduleName")}
        />
        <FieldError
          baseId={formId}
          field="scheduleName"
          message={errors.scheduleName?.message}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Description</span>
        <textarea
          className={`min-h-[4rem] rounded border px-2 py-1 text-sm ${
            errors.description ? "border-red-300" : "border-slate-200"
          }`}
          rows={3}
          {...register("description")}
        />
        <FieldError
          baseId={formId}
          field="description"
          message={errors.description?.message}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register("enabled")} />
        Schedule enabled
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Schedule type</span>
        <select
          className="rounded border border-slate-200 px-2 py-1 text-sm"
          {...register("scheduleKind")}
        >
          <option value="rate">Recurring rate</option>
          <option value="cron">Recurring cron</option>
          <option value="at">One-time</option>
          <option value="custom">Custom expression</option>
        </select>
      </label>

      {scheduleKind === "rate" && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Every</span>
            <input
              type="number"
              min={1}
              className={`rounded border px-2 py-1 text-sm ${
                errors.rateValue ? "border-red-300" : "border-slate-200"
              }`}
              {...register("rateValue", { valueAsNumber: true })}
            />
            <FieldError
              baseId={formId}
              field="rateValue"
              message={errors.rateValue?.message}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Unit</span>
            <select
              className="rounded border border-slate-200 px-2 py-1 text-sm"
              {...register("rateUnit")}
            >
              <option value="minute">Minutes</option>
              <option value="hour">Hours</option>
              <option value="day">Days</option>
            </select>
          </label>
        </div>
      )}

      {scheduleKind === "cron" && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Timezone (IANA)</span>
            <input
              className={`rounded border px-2 py-1 font-mono text-sm ${
                errors.timezone ? "border-red-300" : "border-slate-200"
              }`}
              placeholder="America/New_York"
              {...register("timezone")}
            />
            <FieldError
              baseId={formId}
              field="timezone"
              message={errors.timezone?.message}
            />
          </label>
          <p className="text-xs text-slate-500">
            Use either day-of-month or day-of-week: leave day-of-week as{" "}
            <code className="rounded bg-slate-100 px-1 font-mono">?</code> or{" "}
            <code className="rounded bg-slate-100 px-1 font-mono">*</code> when using
            day-of-month, or set a specific day-of-week and omit wildcards on the other
            axis (matches CDK/EventBridge rules).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <CronField formId={formId} register={register} errors={errors} field="cronMinute" label="Minute" />
            <CronField formId={formId} register={register} errors={errors} field="cronHour" label="Hour" />
            <CronField formId={formId} register={register} errors={errors} field="cronDay" label="Day of month" />
            <CronField formId={formId} register={register} errors={errors} field="cronMonth" label="Month" />
            <CronField formId={formId} register={register} errors={errors} field="cronWeekDay" label="Day of week" />
            <CronField formId={formId} register={register} errors={errors} field="cronYear" label="Year (opt.)" />
          </div>
        </div>
      )}

      {scheduleKind === "at" && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Date and time (ISO 8601)</span>
            <input
              className={`rounded border px-2 py-1 font-mono text-sm ${
                errors.atIso ? "border-red-300" : "border-slate-200"
              }`}
              placeholder="2025-12-31T15:00:00"
              {...register("atIso")}
            />
            <FieldError baseId={formId} field="atIso" message={errors.atIso?.message} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Timezone (IANA)</span>
            <input
              className={`rounded border px-2 py-1 font-mono text-sm ${
                errors.timezone ? "border-red-300" : "border-slate-200"
              }`}
              {...register("timezone")}
            />
            <FieldError
              baseId={formId}
              field="timezone"
              message={errors.timezone?.message}
            />
          </label>
        </div>
      )}

      {scheduleKind === "custom" && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Schedule expression</span>
            <span className="text-xs text-slate-500">
              e.g. <code className="rounded bg-slate-100 px-1">rate(1 hour)</code> or{" "}
              <code className="rounded bg-slate-100 px-1">cron(0 12 * * ? *)</code>
            </span>
            <input
              className={`rounded border px-2 py-1 font-mono text-sm ${
                errors.customExpression ? "border-red-300" : "border-slate-200"
              }`}
              {...register("customExpression")}
            />
            <FieldError
              baseId={formId}
              field="customExpression"
              message={errors.customExpression?.message}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Timezone (IANA, optional)</span>
            <input
              className="rounded border border-slate-200 px-2 py-1 font-mono text-sm"
              placeholder="Leave empty for UTC"
              {...register("timezone")}
            />
            <FieldError
              baseId={formId}
              field="timezone"
              message={errors.timezone?.message}
            />
          </label>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Flexible time window</span>
        <select
          className="rounded border border-slate-200 px-2 py-1 text-sm"
          {...register("flexibleWindowMode")}
        >
          <option value="off">Off</option>
          <option value="flexible">Flexible</option>
        </select>
      </label>

      {flexibleMode === "flexible" && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-700">Maximum window (minutes)</span>
          <span className="text-xs text-slate-500">1–1440</span>
          <input
            type="number"
            min={1}
            max={1440}
            className={`rounded border px-2 py-1 text-sm ${
              errors.flexibleWindowMaxMinutes ? "border-red-300" : "border-slate-200"
            }`}
            {...register("flexibleWindowMaxMinutes", { valueAsNumber: true })}
          />
          <FieldError
            baseId={formId}
            field="flexibleWindowMaxMinutes"
            message={errors.flexibleWindowMaxMinutes?.message}
          />
        </label>
      )}

      <div className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Schedule window (optional, recurring)</span>
        <span className="text-xs text-slate-500">
          Start and end boundaries in UTC (ISO 8601). Ignored for one-time schedules.
        </span>
        <label className="mt-1 flex flex-col gap-1">
          <span className="text-xs text-slate-600">Start</span>
          <input
            className="rounded border border-slate-200 px-2 py-1 font-mono text-sm"
            placeholder="2025-01-01T00:00:00.000Z"
            {...register("startDateIso")}
          />
          <FieldError
            baseId={formId}
            field="startDateIso"
            message={errors.startDateIso?.message}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600">End</span>
          <input
            className="rounded border border-slate-200 px-2 py-1 font-mono text-sm"
            {...register("endDateIso")}
          />
          <FieldError
            baseId={formId}
            field="endDateIso"
            message={errors.endDateIso?.message}
          />
        </label>
      </div>
    </>
  );
}

function CronField({
  formId,
  register,
  errors,
  field,
  label,
}: {
  formId: string;
  register: NodeInspectorFieldsProps["register"];
  errors: NodeInspectorFieldsProps["errors"];
  field:
    | "cronMinute"
    | "cronHour"
    | "cronDay"
    | "cronMonth"
    | "cronWeekDay"
    | "cronYear";
  label: string;
}) {
  const err = errors[field];
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-700">{label}</span>
      <input
        className={`rounded border px-2 py-1 font-mono text-sm ${
          err ? "border-red-300" : "border-slate-200"
        }`}
        {...register(field)}
      />
      <FieldError baseId={formId} field={field} message={err?.message} />
    </label>
  );
}

export const eventbridgeSchedulerUiModule: UiServiceModule = {
  canvasNode: EventbridgeSchedulerCanvasNode,
  canvasTitle,
  InspectorFields: EventbridgeSchedulerInspectorFields,
};
