import type { GraphNode } from "../../domain/types";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import { SnsCanvasNode } from "../flow/nodes/SnsCanvasNode";
import type { NodeInspectorFieldsProps, UiServiceModule } from "./types";

function canvasTitle(node: GraphNode): string {
  return String((node.config.name as string | undefined)?.trim() || "Topic");
}

function SnsStandardInspectorFields({
  formId,
  register,
  errors,
}: NodeInspectorFieldsProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-700">Topic name</span>
      <span className="text-xs text-slate-500">
        Letters, numbers, hyphens, underscores. Do not use a{" "}
        <code className="rounded bg-slate-100 px-1 font-mono">.fifo</code> suffix.
        Encryption uses AWS-managed KMS (alias/aws/sns).
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
  );
}

export const snsStandardUiModule: UiServiceModule = {
  canvasNode: SnsCanvasNode,
  canvasTitle,
  InspectorFields: SnsStandardInspectorFields,
};
