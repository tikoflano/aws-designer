import type { GraphNode } from "../../domain/types";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import { S3CanvasNode } from "../flow/nodes/S3CanvasNode";
import type { NodeInspectorFieldsProps, UiServiceModule } from "./types";

function canvasTitle(node: GraphNode): string {
  const c = node.config;
  return String(
    (c.name as string | undefined)?.trim() ||
      (c.bucketName as string | undefined)?.trim() ||
      "Bucket",
  );
}

function S3InspectorFields({
  formId,
  register,
  errors,
}: NodeInspectorFieldsProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-700">Name</span>
      <span className="text-xs text-slate-500">
        Global S3 bucket name: 3–63 characters, lowercase letters, digits, dots,
        and hyphens only. SSE-S3 encryption is always enabled on the bucket.
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

export const s3UiModule: UiServiceModule = {
  canvasNode: S3CanvasNode,
  canvasTitle,
  InspectorFields: S3InspectorFields,
};
