import { useState } from "react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";

import * as graphApi from "../../api/graphApi";
import type { GraphNode } from "../../domain/types";
import {
  defaultInlineSourceForRuntime,
  LAMBDA_ZIP_MAX_BYTES,
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
  const rt = (base.runtime as LambdaRuntime) ?? "nodejs20.x";
  let codeSource = base.codeSource as
    | { type?: string; inlineSource?: string }
    | undefined;
  if (!codeSource || typeof codeSource !== "object" || !("type" in codeSource)) {
    codeSource = { type: "inline" };
  }
  if (codeSource.type === "uploadedZip") {
    return { ...base, codeSource: { type: "uploadedZip" } };
  }
  const inlineSource =
    codeSource.inlineSource !== undefined && String(codeSource.inlineSource).length > 0
      ? codeSource.inlineSource
      : defaultInlineSourceForRuntime(rt);
  return {
    ...base,
    codeSource: { type: "inline", inlineSource },
  };
}

function LambdaZipUploadSection({
  graphId,
  nodeId,
  setValue,
}: {
  graphId: string | null | undefined;
  nodeId: string;
  setValue: NodeInspectorFieldsProps["setValue"];
}) {
  const [busy, setBusy] = useState(false);
  const maxMb = Math.round(LAMBDA_ZIP_MAX_BYTES / (1024 * 1024));

  if (!graphId) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 px-2 py-2 text-xs text-amber-900">
        Save the graph to the server first. Then choose “Uploaded .zip”, click Save, and upload your
        deployment package (max {maxMb} MB).
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-600">
        After switching to this mode, click <strong>Save</strong> above so the server stores the
        configuration. Then upload a valid Lambda deployment .zip (max {maxMb} MB). Files are kept on
        the server under <code className="rounded bg-slate-100 px-1">server/data/lambda-assets/</code>
        .
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Deployment package (.zip)</span>
        <input
          type="file"
          accept=".zip,application/zip"
          disabled={busy}
          className="text-sm file:mr-2 file:rounded file:border file:border-slate-300 file:bg-white file:px-2 file:py-1"
          onChange={(e) => {
            const input = e.target;
            const f = input.files?.[0];
            input.value = "";
            if (!f) return;
            void (async () => {
              setBusy(true);
              try {
                await graphApi.uploadLambdaZip(graphId, nodeId, f);
                setValue("codeSource", { type: "uploadedZip" }, { shouldDirty: true, shouldValidate: true });
                toast.success("Lambda zip uploaded.");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed.");
              } finally {
                setBusy(false);
              }
            })();
          }}
        />
      </label>
    </div>
  );
}

function LambdaInspectorFields({
  formId,
  node,
  serverGraphId,
  register,
  control,
  errors,
  getValues,
  setValue,
}: NodeInspectorFieldsProps) {
  const codeSource = useWatch({ control, name: "codeSource" }) as
    | { type?: string }
    | undefined;
  const sourceType = codeSource?.type === "uploadedZip" ? "uploadedZip" : "inline";

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
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Code deployment</span>
        <select
          className="rounded border border-slate-200 px-2 py-1 text-sm"
          value={sourceType}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "inline") {
              setValue(
                "codeSource",
                {
                  type: "inline",
                  inlineSource: defaultInlineSourceForRuntime(
                    (getValues("runtime") as LambdaRuntime) ?? "nodejs20.x",
                  ),
                },
                { shouldDirty: true, shouldValidate: true },
              );
            } else {
              setValue("codeSource", { type: "uploadedZip" }, { shouldDirty: true, shouldValidate: true });
            }
          }}
        >
          <option value="inline">Inline (small snippet, CloudFormation limit)</option>
          <option value="uploadedZip">Uploaded .zip (deployment package)</option>
        </select>
      </label>
      {sourceType === "inline" ? (
        <LambdaInlineSourceField
          control={control}
          getValues={getValues}
          setValue={setValue}
          errors={errors}
          formId={formId}
        />
      ) : (
        <LambdaZipUploadSection graphId={serverGraphId} nodeId={node.id} setValue={setValue} />
      )}
    </>
  );
}

export const lambdaUiModule: UiServiceModule = {
  canvasNode: LambdaCanvasNode,
  canvasTitle,
  InspectorFields: LambdaInspectorFields,
  inspectorFormDefaults: lambdaInspectorFormDefaults,
};
