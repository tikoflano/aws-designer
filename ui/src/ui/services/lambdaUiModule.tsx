import type { GraphNode } from "../../domain/types";
import {
  defaultInlineSourceForRuntime,
  type LambdaRuntime,
  type ServiceDefinition,
} from "@compiler/catalog.ts";
import { LambdaEnvVarsField } from "../inspector/LambdaEnvVarsField";
import { LambdaInlineSourceField } from "../inspector/LambdaInlineSourceField";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import { LambdaCanvasNode } from "../flow/nodes/LambdaCanvasNode";
import type { FormValues, NodeInspectorFieldsProps, UiServiceModule } from "./types";

function canvasTitle(node: GraphNode): string {
  return String(node.config.functionName ?? "Lambda");
}

function lambdaInspectorFormDefaults(
  _node: GraphNode,
  base: FormValues,
  svc: ServiceDefinition,
): FormValues {
  void svc;
  return {
    ...base,
    inlineSource:
      (base.inlineSource as string | undefined) ??
      defaultInlineSourceForRuntime(base.runtime as LambdaRuntime),
  };
}

function LambdaInspectorFields({
  formId,
  register,
  control,
  errors,
  getValues,
  setValue,
}: NodeInspectorFieldsProps) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Function name</span>
        <input
          className={`rounded border px-2 py-1 text-sm ${
            errors.functionName ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.functionName ? true : undefined}
          aria-describedby={
            errors.functionName?.message
              ? fieldErrorId(formId, "functionName")
              : undefined
          }
          {...register("functionName")}
        />
        <FieldError
          baseId={formId}
          field="functionName"
          message={errors.functionName?.message}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Handler</span>
        <input
          className={`rounded border px-2 py-1 text-sm ${
            errors.handler ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.handler ? true : undefined}
          aria-describedby={
            errors.handler?.message ? fieldErrorId(formId, "handler") : undefined
          }
          {...register("handler")}
        />
        <FieldError
          baseId={formId}
          field="handler"
          message={errors.handler?.message}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Runtime</span>
        <select
          className={`rounded border px-2 py-1 text-sm ${
            errors.runtime ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.runtime ? true : undefined}
          aria-describedby={
            errors.runtime?.message ? fieldErrorId(formId, "runtime") : undefined
          }
          {...register("runtime")}
        >
          <option value="nodejs18.x">nodejs18.x</option>
          <option value="nodejs20.x">nodejs20.x</option>
          <option value="nodejs22.x">nodejs22.x</option>
          <option value="python3.12">python3.12</option>
          <option value="python3.13">python3.13</option>
        </select>
        <FieldError
          baseId={formId}
          field="runtime"
          message={errors.runtime?.message}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Memory (MB)</span>
        <span className="text-xs text-slate-500">128–10240</span>
        <input
          type="number"
          min={128}
          max={10240}
          step={1}
          className={`rounded border px-2 py-1 text-sm ${
            errors.memorySizeMb ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.memorySizeMb ? true : undefined}
          aria-describedby={
            errors.memorySizeMb?.message
              ? fieldErrorId(formId, "memorySizeMb")
              : undefined
          }
          {...register("memorySizeMb", { valueAsNumber: true })}
        />
        <FieldError
          baseId={formId}
          field="memorySizeMb"
          message={errors.memorySizeMb?.message}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Ephemeral storage (MB)</span>
        <span className="text-xs text-slate-500">512–10240 (/tmp)</span>
        <input
          type="number"
          min={512}
          max={10240}
          step={1}
          className={`rounded border px-2 py-1 text-sm ${
            errors.ephemeralStorageMb ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.ephemeralStorageMb ? true : undefined}
          aria-describedby={
            errors.ephemeralStorageMb?.message
              ? fieldErrorId(formId, "ephemeralStorageMb")
              : undefined
          }
          {...register("ephemeralStorageMb", { valueAsNumber: true })}
        />
        <FieldError
          baseId={formId}
          field="ephemeralStorageMb"
          message={errors.ephemeralStorageMb?.message}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Timeout (seconds)</span>
        <span className="text-xs text-slate-500">1–900</span>
        <input
          type="number"
          min={1}
          max={900}
          step={1}
          className={`rounded border px-2 py-1 text-sm ${
            errors.timeoutSeconds ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.timeoutSeconds ? true : undefined}
          aria-describedby={
            errors.timeoutSeconds?.message
              ? fieldErrorId(formId, "timeoutSeconds")
              : undefined
          }
          {...register("timeoutSeconds", { valueAsNumber: true })}
        />
        <FieldError
          baseId={formId}
          field="timeoutSeconds"
          message={errors.timeoutSeconds?.message}
        />
      </label>
      <LambdaEnvVarsField control={control} formId={formId} errors={errors} />
      <LambdaInlineSourceField
        control={control}
        getValues={getValues}
        setValue={setValue}
        errors={errors}
        formId={formId}
      />
    </>
  );
}

export const lambdaUiModule: UiServiceModule = {
  canvasNode: LambdaCanvasNode,
  canvasTitle,
  InspectorFields: LambdaInspectorFields,
  inspectorFormDefaults: lambdaInspectorFormDefaults,
};
