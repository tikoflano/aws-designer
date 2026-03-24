import type { GraphNode } from "../../domain/types";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import { Route53CanvasNode } from "../flow/nodes/Route53CanvasNode";
import type { NodeInspectorFieldsProps, UiServiceModule } from "./types";

function canvasTitle(node: GraphNode): string {
  return String((node.config.name as string | undefined)?.trim() || "DNS");
}

function Route53InspectorFields({
  formId,
  register,
  errors,
}: NodeInspectorFieldsProps) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Zone name</span>
        <span className="text-xs text-slate-500">
          Hosted zone domain, e.g. example.com
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
        <span className="text-slate-700">Type</span>
        <select
          className="rounded border border-slate-200 px-2 py-1 text-sm"
          {...register("type")}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </label>
    </>
  );
}

export const route53UiModule: UiServiceModule = {
  canvasNode: Route53CanvasNode,
  canvasTitle,
  InspectorFields: Route53InspectorFields,
};
