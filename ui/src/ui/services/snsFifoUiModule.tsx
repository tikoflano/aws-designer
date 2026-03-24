import type { GraphNode } from "../../domain/types";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import { SnsCanvasNode } from "../flow/nodes/SnsCanvasNode";
import type { NodeInspectorFieldsProps, UiServiceModule } from "./types";

function canvasTitle(node: GraphNode): string {
  return String((node.config.name as string | undefined)?.trim() || "Topic");
}

function SnsFifoInspectorFields({
  formId,
  register,
  errors,
}: NodeInspectorFieldsProps) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">High throughput</span>
        <span className="text-xs text-slate-500">
          FIFO throughput and deduplication scope. Content-based deduplication
          is enabled.
        </span>
        <select
          className={`rounded border px-2 py-1 text-sm ${
            errors.fifoThroughputScope ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.fifoThroughputScope ? true : undefined}
          aria-describedby={
            errors.fifoThroughputScope?.message
              ? fieldErrorId(formId, "fifoThroughputScope")
              : undefined
          }
          {...register("fifoThroughputScope")}
        >
          <option value="message_group">Message group scope (default)</option>
          <option value="topic">Topic scope</option>
        </select>
        <FieldError
          baseId={formId}
          field="fifoThroughputScope"
          message={errors.fifoThroughputScope?.message}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Topic name</span>
        <span className="text-xs text-slate-500">
          Letters, numbers, hyphens, underscores.{" "}
          <code className="rounded bg-slate-100 px-1 font-mono">.fifo</code> is
          appended if missing. Encryption uses AWS-managed KMS (alias/aws/sns).
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

export const snsFifoUiModule: UiServiceModule = {
  canvasNode: SnsCanvasNode,
  canvasTitle,
  InspectorFields: SnsFifoInspectorFields,
};
