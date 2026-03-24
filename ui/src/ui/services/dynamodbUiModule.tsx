import { useWatch } from "react-hook-form";

import type { GraphNode } from "../../domain/types";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import { DynamodbCanvasNode } from "../flow/nodes/DynamodbCanvasNode";
import type { NodeInspectorFieldsProps, UiServiceModule } from "./types";

function canvasTitle(node: GraphNode): string {
  return String((node.config.name as string | undefined)?.trim() || "Table");
}

function DynamodbInspectorFields({
  formId,
  register,
  control,
  errors,
}: NodeInspectorFieldsProps) {
  const sortKeyNameWatch = useWatch({
    control,
    name: "sortKeyName",
  }) as string | undefined;

  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Table name</span>
        <span className="text-xs text-slate-500">
          3–255 characters; letters, numbers, underscores, hyphens, dots. On-demand
          billing, AWS-managed encryption, point-in-time recovery enabled.
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
        <span className="text-slate-700">Partition key</span>
        <input
          className={`rounded border px-2 py-1 font-mono text-sm ${
            errors.partitionKeyName ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.partitionKeyName ? true : undefined}
          aria-describedby={
            errors.partitionKeyName?.message
              ? fieldErrorId(formId, "partitionKeyName")
              : undefined
          }
          {...register("partitionKeyName")}
        />
        <FieldError
          baseId={formId}
          field="partitionKeyName"
          message={errors.partitionKeyName?.message}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Partition key type</span>
        <select
          className={`rounded border px-2 py-1 text-sm ${
            errors.partitionKeyType ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.partitionKeyType ? true : undefined}
          aria-describedby={
            errors.partitionKeyType?.message
              ? fieldErrorId(formId, "partitionKeyType")
              : undefined
          }
          {...register("partitionKeyType")}
        >
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="binary">Binary</option>
        </select>
        <FieldError
          baseId={formId}
          field="partitionKeyType"
          message={errors.partitionKeyType?.message}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Sort key (optional)</span>
        <span className="text-xs text-slate-500">
          Leave blank for partition-key-only table. If set, choose a sort key type
          below.
        </span>
        <input
          className={`rounded border px-2 py-1 font-mono text-sm ${
            errors.sortKeyName ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.sortKeyName ? true : undefined}
          aria-describedby={
            errors.sortKeyName?.message
              ? fieldErrorId(formId, "sortKeyName")
              : undefined
          }
          {...register("sortKeyName")}
        />
        <FieldError
          baseId={formId}
          field="sortKeyName"
          message={errors.sortKeyName?.message}
        />
      </label>
      {String(sortKeyNameWatch ?? "").trim() !== "" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-700">Sort key type</span>
          <select
            className={`rounded border px-2 py-1 text-sm ${
              errors.sortKeyType ? "border-red-300" : "border-slate-200"
            }`}
            aria-invalid={errors.sortKeyType ? true : undefined}
            aria-describedby={
              errors.sortKeyType?.message
                ? fieldErrorId(formId, "sortKeyType")
                : undefined
            }
            {...register("sortKeyType")}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="binary">Binary</option>
          </select>
          <FieldError
            baseId={formId}
            field="sortKeyType"
            message={errors.sortKeyType?.message}
          />
        </label>
      ) : null}
    </>
  );
}

export const dynamodbUiModule: UiServiceModule = {
  canvasNode: DynamodbCanvasNode,
  canvasTitle,
  InspectorFields: DynamodbInspectorFields,
};
