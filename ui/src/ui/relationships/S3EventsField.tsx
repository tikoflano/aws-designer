import type { UseFormReturn } from "react-hook-form";

import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import type { FormValues } from "../services/types";

export function S3EventsField({
  form,
  baseId,
  eventsError,
}: {
  form: UseFormReturn<FormValues>;
  baseId: string;
  eventsError?: string;
}) {
  const events = (form.watch("events") as string[] | undefined) ?? [];
  const toggle = (value: string) => {
    const set = new Set(events);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    form.setValue("events", [...set], { shouldValidate: true });
  };

  return (
    <div
      className="flex flex-col gap-1"
      aria-invalid={eventsError ? true : undefined}
      aria-describedby={
        eventsError ? fieldErrorId(baseId, "events") : undefined
      }
    >
      {(["s3:ObjectCreated:*", "s3:ObjectRemoved:*"] as const).map((ev) => (
        <label key={ev} className="flex items-center gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={events.includes(ev)}
            onChange={() => toggle(ev)}
          />
          <span className="text-xs font-mono">{ev}</span>
        </label>
      ))}
      <FieldError baseId={baseId} field="events" message={eventsError} />
    </div>
  );
}
