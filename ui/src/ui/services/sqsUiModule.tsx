import type { GraphNode } from "../../domain/types";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import { SqsCanvasNode } from "../flow/nodes/SqsCanvasNode";
import type { NodeInspectorFieldsProps, UiServiceModule } from "./types";

function canvasTitle(node: GraphNode): string {
  return String((node.config.name as string | undefined)?.trim() || "Queue");
}

function SqsInspectorFields({
  formId,
  register,
  errors,
}: NodeInspectorFieldsProps) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Queue type</span>
        <select
          className={`rounded border px-2 py-1 text-sm ${
            errors.queueType ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.queueType ? true : undefined}
          aria-describedby={
            errors.queueType?.message
              ? fieldErrorId(formId, "queueType")
              : undefined
          }
          {...register("queueType")}
        >
          <option value="standard">Standard (default)</option>
          <option value="fifo">FIFO</option>
        </select>
        <FieldError
          baseId={formId}
          field="queueType"
          message={errors.queueType?.message}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Queue name</span>
        <span className="text-xs text-slate-500">
          Letters, numbers, hyphens, underscores. Standard: no{" "}
          <code className="rounded bg-slate-100 px-1 font-mono">.fifo</code>. FIFO:
          <code className="rounded bg-slate-100 px-1 font-mono">.fifo</code> added if
          missing. A matching DLQ is created (
          <code className="font-mono text-[11px]">-dlq</code> suffix). Defaults:
          visibility 30s, retention 4 days, max message 1024 KiB, SSE-SQS, DLQ max
          receives 10.
        </span>
        <input
          className={`rounded border px-2 py-1 text-sm ${
            errors.name ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={
            errors.name?.message ? fieldErrorId(formId, "name") : undefined
          }
          {...register("name")}
        />
        <FieldError
          baseId={formId}
          field="name"
          message={errors.name?.message}
        />
      </label>
    </>
  );
}

export const sqsUiModule: UiServiceModule = {
  canvasNode: SqsCanvasNode,
  canvasTitle,
  InspectorFields: SqsInspectorFields,
};
