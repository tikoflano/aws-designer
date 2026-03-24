import type { GraphNode } from "../../domain/types";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import { CloudFrontCanvasNode } from "../flow/nodes/CloudFrontCanvasNode";
import type { NodeInspectorFieldsProps, UiServiceModule } from "./types";

function canvasTitle(node: GraphNode): string {
  const c = node.config;
  return String(
    (c.name as string | undefined)?.trim() ||
      (c.comment as string | undefined)?.trim() ||
      "Distribution",
  );
}

function CloudFrontInspectorFields({
  formId,
  register,
  errors,
}: NodeInspectorFieldsProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-700">Name</span>
      <span className="text-xs text-slate-500">
        Identifies this distribution on the canvas and is sent to AWS as the
        distribution comment.
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

export const cloudfrontUiModule: UiServiceModule = {
  canvasNode: CloudFrontCanvasNode,
  canvasTitle,
  InspectorFields: CloudFrontInspectorFields,
};
