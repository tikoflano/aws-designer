import type { GraphNode } from "../../domain/types";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import { SecretsManagerCanvasNode } from "../flow/nodes/SecretsManagerCanvasNode";
import type { NodeInspectorFieldsProps, UiServiceModule } from "./types";

function canvasTitle(node: GraphNode): string {
  return String((node.config.name as string | undefined)?.trim() || "Secret");
}

function SecretsManagerInspectorFields({
  formId,
  register,
  errors,
}: NodeInspectorFieldsProps) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Secret name</span>
        <span className="text-xs text-slate-500">
          AWS secret name (other type of secret; value stored as JSON with one
          key). Appears in templates—avoid real production secrets in the graph.
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
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Key</span>
        <input
          className={`rounded border px-2 py-1 font-mono text-sm ${
            errors.secretKey ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.secretKey ? true : undefined}
          aria-describedby={
            errors.secretKey?.message
              ? fieldErrorId(formId, "secretKey")
              : undefined
          }
          {...register("secretKey")}
        />
        <FieldError
          baseId={formId}
          field="secretKey"
          message={errors.secretKey?.message}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Value</span>
        <textarea
          rows={3}
          className={`rounded border px-2 py-1 font-mono text-xs ${
            errors.secretValue ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.secretValue ? true : undefined}
          aria-describedby={
            errors.secretValue?.message
              ? fieldErrorId(formId, "secretValue")
              : undefined
          }
          {...register("secretValue")}
        />
        <FieldError
          baseId={formId}
          field="secretValue"
          message={errors.secretValue?.message}
        />
      </label>
    </>
  );
}

export const secretsmanagerUiModule: UiServiceModule = {
  canvasNode: SecretsManagerCanvasNode,
  canvasTitle,
  InspectorFields: SecretsManagerInspectorFields,
};
