import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import type { GraphEdge, GraphNode } from "../../domain/types";
import {
  defaultInlineSourceForRuntime,
  getRelationship,
  getService,
  type LambdaRuntime,
  type RelationshipDefinition,
  type ServiceDefinition,
} from "@compiler/catalog.ts";
import { useGraphStore } from "../../state/graphStore";

import { HelpInfoPopover } from "../common/HelpInfoPopover";
import { LambdaEnvVarsField } from "./LambdaEnvVarsField";
import { LambdaInlineSourceField } from "./LambdaInlineSourceField";

type FormValues = Record<string, unknown>;

function nodeInspectorFormDefaults(
  node: GraphNode,
  svc: ServiceDefinition,
): FormValues {
  const result = svc.configSchema.safeParse(node.config);
  const base = (
    result.success ? result.data : { ...node.config }
  ) as FormValues;
  if (node.serviceId !== "lambda") return base;
  return {
    ...base,
    inlineSource:
      (base.inlineSource as string | undefined) ??
      defaultInlineSourceForRuntime(base.runtime as LambdaRuntime),
  };
}

function fieldErrorId(baseId: string, field: string) {
  return `${baseId}-${field}-err`;
}

function FieldError({
  baseId,
  field,
  message,
}: {
  baseId: string;
  field: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p
      id={fieldErrorId(baseId, field)}
      className="text-xs text-red-600"
      role="alert"
    >
      {message}
    </p>
  );
}

function CloseCrossIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function InspectorPanel() {
  const selection = useGraphStore((s) => s.selection);
  const inspectorDismissed = useGraphStore((s) => s.inspectorDismissed);
  const dismissInspector = useGraphStore((s) => s.dismissInspector);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const updateNode = useGraphStore((s) => s.updateNode);
  const updateEdgeConfig = useGraphStore((s) => s.updateEdgeConfig);
  const removeNode = useGraphStore((s) => s.removeNode);
  const removeEdge = useGraphStore((s) => s.removeEdge);

  const selectedNode =
    selection?.kind === "node"
      ? (nodes.find((n) => n.id === selection.id) ?? null)
      : null;
  const selectedEdge =
    selection?.kind === "edge"
      ? (edges.find((e) => e.id === selection.id) ?? null)
      : null;

  const showOnMobile = Boolean(selection);
  const showOnDesktop = !inspectorDismissed;

  return (
    <aside
      className={`flex w-full flex-col border-slate-200 bg-white md:w-80 md:border-l ${
        showOnMobile
          ? "max-md:max-h-[min(45vh,22rem)] max-md:shrink-0 max-md:border-t"
          : "max-md:hidden"
      } ${!showOnDesktop ? "md:hidden" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Inspector
        </div>
        <button
          type="button"
          onClick={() => dismissInspector()}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Close inspector"
        >
          <CloseCrossIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 md:flex-1">
        {!selection && (
          <p className="text-sm text-slate-600">
            Select a node or edge to edit configuration.
          </p>
        )}
        {selectedNode && (
          <NodeInspector
            key={selectedNode.id}
            node={selectedNode}
            onSave={(config) => updateNode(selectedNode.id, { config })}
            onRemove={() => removeNode(selectedNode.id)}
          />
        )}
        {selectedEdge && (
          <EdgeInspector
            key={selectedEdge.id}
            edge={selectedEdge}
            onSave={(config) => updateEdgeConfig(selectedEdge.id, config)}
            onRemove={() => removeEdge(selectedEdge.id)}
          />
        )}
      </div>
    </aside>
  );
}

function NodeInspector({
  node,
  onSave,
  onRemove,
}: {
  node: GraphNode;
  onSave: (config: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const svc = getService(node.serviceId, node.serviceVersion);
  if (!svc) {
    return (
      <p className="text-sm text-red-600">Unknown service version for this node.</p>
    );
  }
  return (
    <NodeInspectorForm
      node={node}
      svc={svc}
      onSave={onSave}
      onRemove={onRemove}
    />
  );
}

function NodeInspectorForm({
  node,
  svc,
  onSave,
  onRemove,
}: {
  node: GraphNode;
  svc: ServiceDefinition;
  onSave: (config: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const formId = useId();
  const defaults = nodeInspectorFormDefaults(node, svc);

  const form = useForm<FormValues>({
    resolver: zodResolver(svc.configSchema),
    defaultValues: defaults,
  });

  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = form;

  const snsTopicTypeWatch = useWatch({ control, name: "topicType" }) as
    | string
    | undefined;

  useEffect(() => {
    form.reset(nodeInspectorFormDefaults(node, svc));
  }, [node.id, node.serviceVersion, node.config, svc, form]); // eslint-disable-line react-hooks/exhaustive-deps -- omit full `node` so drag updates do not reset the form

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((values) => {
        const parsed = svc.configSchema.parse(values);
        onSave(parsed);
      })}
    >
      <div>
        <div className="text-sm font-semibold text-slate-900">
          {svc.displayName}
        </div>
        <div className="text-xs text-slate-500">
          {svc.id} v{node.serviceVersion} · node {node.id}
        </div>
      </div>

      {node.serviceId === "s3" && (
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
      )}

      {node.serviceId === "lambda" && (
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
                errors.handler?.message
                  ? fieldErrorId(formId, "handler")
                  : undefined
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
                errors.runtime?.message
                  ? fieldErrorId(formId, "runtime")
                  : undefined
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
      )}

      {node.serviceId === "cloudfront" && (
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
      )}

      {node.serviceId === "route53" && (
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
                errors.name?.message
                  ? fieldErrorId(formId, "name")
                  : undefined
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
      )}

      {node.serviceId === "sns" && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Topic type</span>
            <select
              className={`rounded border px-2 py-1 text-sm ${
                errors.topicType ? "border-red-300" : "border-slate-200"
              }`}
              aria-invalid={errors.topicType ? true : undefined}
              aria-describedby={
                errors.topicType?.message
                  ? fieldErrorId(formId, "topicType")
                  : undefined
              }
              {...register("topicType")}
            >
              <option value="standard">Standard</option>
              <option value="fifo">FIFO</option>
            </select>
            <FieldError
              baseId={formId}
              field="topicType"
              message={errors.topicType?.message}
            />
          </label>
          {node.serviceId === "sns" && snsTopicTypeWatch === "fifo" && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-700">High throughput (FIFO)</span>
              <span className="text-xs text-slate-500">
                SNS FIFO throughput and deduplication scope. Content-based
                deduplication stays on for FIFO topics.
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
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Topic name</span>
            <span className="text-xs text-slate-500">
              Letters, numbers, hyphens, underscores. Standard: no{" "}
              <code className="rounded bg-slate-100 px-1 font-mono">.fifo</code> suffix.
              FIFO: suffix added if missing. Encryption uses AWS-managed KMS
              (alias/aws/sns).
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
      )}

      {node.serviceId === "secretsmanager" && (
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
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Save
        </button>
        <button
          type="button"
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          onClick={onRemove}
        >
          Delete node
        </button>
      </div>
    </form>
  );
}

function EdgeInspector({
  edge,
  onSave,
  onRemove,
}: {
  edge: GraphEdge;
  onSave: (config: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const rel = getRelationship(edge.relationshipId, edge.relationshipVersion);
  if (!rel) {
    return (
      <p className="text-sm text-red-600">Unknown relationship for this edge.</p>
    );
  }
  return (
    <EdgeInspectorForm
      edge={edge}
      rel={rel}
      onSave={onSave}
      onRemove={onRemove}
    />
  );
}

function EdgeInspectorForm({
  edge,
  rel,
  onSave,
  onRemove,
}: {
  edge: GraphEdge;
  rel: RelationshipDefinition;
  onSave: (config: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const formId = useId();
  const defaults = rel.configSchema.parse(edge.config) as FormValues;

  const form = useForm<FormValues>({
    resolver: zodResolver(rel.configSchema),
    defaultValues: defaults,
  });

  const {
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    form.reset(rel.configSchema.parse(edge.config) as FormValues);
  }, [edge.id, edge.relationshipVersion, edge.config, rel, form]);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((values) => {
        const parsed = rel.configSchema.parse(values);
        onSave(parsed);
      })}
    >
      <div>
        <div className="text-sm font-semibold text-slate-900">{rel.name}</div>
        <div className="text-xs text-slate-500">
          {rel.id} v{edge.relationshipVersion} · edge {edge.id}
        </div>
        <div className="mt-1 text-xs text-slate-600">{rel.description}</div>
      </div>

      {rel.id === "lambda_reads_s3" && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Object key prefix</span>
            <input
              className={`rounded border px-2 py-1 text-sm ${
                errors.objectKeyPrefix ? "border-red-300" : "border-slate-200"
              }`}
              aria-invalid={errors.objectKeyPrefix ? true : undefined}
              aria-describedby={
                errors.objectKeyPrefix?.message
                  ? fieldErrorId(formId, "objectKeyPrefix")
                  : undefined
              }
              {...register("objectKeyPrefix")}
            />
            <FieldError
              baseId={formId}
              field="objectKeyPrefix"
              message={errors.objectKeyPrefix?.message}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("includeListBucket")} />
            Include s3:ListBucket
          </label>
        </>
      )}

      {rel.id === "lambda_writes_s3" && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-700">Object key prefix</span>
          <input
            className={`rounded border px-2 py-1 text-sm ${
              errors.objectKeyPrefix ? "border-red-300" : "border-slate-200"
            }`}
            aria-invalid={errors.objectKeyPrefix ? true : undefined}
            aria-describedby={
              errors.objectKeyPrefix?.message
                ? fieldErrorId(formId, "objectKeyPrefix")
                : undefined
            }
            {...register("objectKeyPrefix")}
          />
          <FieldError
            baseId={formId}
            field="objectKeyPrefix"
            message={errors.objectKeyPrefix?.message}
          />
        </label>
      )}

      {rel.id === "s3_triggers_lambda" && (
        <>
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-slate-700">Events</span>
            <span className="text-xs text-slate-500">
              Select at least one event type.
            </span>
            <S3EventsField
              form={form}
              baseId={formId}
              eventsError={errors.events?.message}
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium text-slate-700">
              Prefix and suffix filters
            </span>
            <HelpInfoPopover
              ariaLabel="About S3 prefix and suffix filters"
              title="S3 notification filters"
            >
              <p>
                Optional limits on which object keys trigger Lambda for the
                events you selected. Leave both blank to react to any key in the
                bucket.
              </p>
              <p>
                <span className="font-medium text-slate-800">Prefix</span> —
                only keys that{" "}
                <span className="font-medium text-slate-800">start</span> with
                this value. Example:{" "}
                <code className="rounded bg-slate-100 px-1 font-mono text-xs">
                  uploads/
                </code>{" "}
                for objects under that path.
              </p>
              <p>
                <span className="font-medium text-slate-800">Suffix</span> —
                only keys that{" "}
                <span className="font-medium text-slate-800">end</span> with
                this value. Example:{" "}
                <code className="rounded bg-slate-100 px-1 font-mono text-xs">
                  .json
                </code>
                .
              </p>
              <p>
                If both are set, the key must match both. That matches
                AWS S3 event notification filter behavior.
              </p>
            </HelpInfoPopover>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Prefix filter</span>
            <input
              className={`rounded border px-2 py-1 text-sm ${
                errors.prefix ? "border-red-300" : "border-slate-200"
              }`}
              aria-invalid={errors.prefix ? true : undefined}
              aria-describedby={
                errors.prefix?.message
                  ? fieldErrorId(formId, "prefix")
                  : undefined
              }
              {...register("prefix")}
            />
            <FieldError
              baseId={formId}
              field="prefix"
              message={errors.prefix?.message}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Suffix filter</span>
            <input
              className={`rounded border px-2 py-1 text-sm ${
                errors.suffix ? "border-red-300" : "border-slate-200"
              }`}
              aria-invalid={errors.suffix ? true : undefined}
              aria-describedby={
                errors.suffix?.message
                  ? fieldErrorId(formId, "suffix")
                  : undefined
              }
              {...register("suffix")}
            />
            <FieldError
              baseId={formId}
              field="suffix"
              message={errors.suffix?.message}
            />
          </label>
        </>
      )}

      {rel.id === "cloudfront_origin_s3" && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-700">Origin path (optional)</span>
          <span className="text-xs text-slate-500">
            Prefix within the bucket served as the root, e.g.{" "}
            <code className="rounded bg-slate-100 px-1 font-mono">static</code>
          </span>
          <input
            className={`rounded border px-2 py-1 text-sm ${
              errors.originPath ? "border-red-300" : "border-slate-200"
            }`}
            aria-invalid={errors.originPath ? true : undefined}
            aria-describedby={
              errors.originPath?.message
                ? fieldErrorId(formId, "originPath")
                : undefined
            }
            {...register("originPath")}
          />
          <FieldError
            baseId={formId}
            field="originPath"
            message={errors.originPath?.message}
          />
        </label>
      )}

      {rel.id === "route53_alias_cloudfront" && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-700">Domain name (FQDN)</span>
          <span className="text-xs text-slate-500">
            Alias and TLS name for CloudFront, e.g. www.example.com or the zone
            apex. Must sit under the hosted zone on the Route 53 node; ACM issues
            a certificate automatically via DNS validation.
          </span>
          <input
            className={`rounded border px-2 py-1 text-sm ${
              errors.domainName ? "border-red-300" : "border-slate-200"
            }`}
            aria-invalid={errors.domainName ? true : undefined}
            aria-describedby={
              errors.domainName?.message
                ? fieldErrorId(formId, "domainName")
                : undefined
            }
            {...register("domainName")}
          />
          <FieldError
            baseId={formId}
            field="domainName"
            message={errors.domainName?.message}
          />
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Save
        </button>
        <button
          type="button"
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          onClick={onRemove}
        >
          Delete edge
        </button>
      </div>
    </form>
  );
}

function S3EventsField({
  form,
  baseId,
  eventsError,
}: {
  form: UseFormReturn<FormValues>;
  baseId: string;
  eventsError?: string;
}) {
  const events = (form.watch("events") as string[] | undefined) ?? [];
  const toggle = (value: string) => {
    const set = new Set(events);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    form.setValue("events", [...set], { shouldValidate: true });
  };

  return (
    <div
      className="flex flex-col gap-1"
      aria-invalid={eventsError ? true : undefined}
      aria-describedby={
        eventsError ? fieldErrorId(baseId, "events") : undefined
      }
    >
      {(["s3:ObjectCreated:*", "s3:ObjectRemoved:*"] as const).map((ev) => (
        <label key={ev} className="flex items-center gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={events.includes(ev)}
            onChange={() => toggle(ev)}
          />
          <span className="text-xs font-mono">{ev}</span>
        </label>
      ))}
      <FieldError baseId={baseId} field="events" message={eventsError} />
    </div>
  );
}
