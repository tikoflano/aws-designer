import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import type { GraphEdge, GraphNode } from "../../domain/types";
import {
  getRelationship,
  getService,
  type RelationshipDefinition,
  type ServiceDefinition,
} from "@compiler/catalog.ts";
import { useGraphStore } from "../../state/graphStore";

type FormValues = Record<string, unknown>;

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
  const defaults = svc.configSchema.parse(node.config) as FormValues;

  const form = useForm<FormValues>({
    resolver: zodResolver(svc.configSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(svc.configSchema.parse(node.config) as FormValues);
  }, [node.id, node.serviceVersion, node.config, svc, form]);

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
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Bucket name (optional)</span>
            <input
              className="rounded border border-slate-200 px-2 py-1 text-sm"
              {...form.register("bucketName")}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...form.register("enforceEncryption")} />
            Enforce SSE-S3 encryption
          </label>
        </>
      )}

      {node.serviceId === "lambda" && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Function name</span>
            <input
              className="rounded border border-slate-200 px-2 py-1 text-sm"
              {...form.register("functionName")}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Handler</span>
            <input
              className="rounded border border-slate-200 px-2 py-1 text-sm"
              {...form.register("handler")}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Runtime</span>
            <select
              className="rounded border border-slate-200 px-2 py-1 text-sm"
              {...form.register("runtime")}
            >
              <option value="nodejs18.x">nodejs18.x</option>
              <option value="nodejs20.x">nodejs20.x</option>
              <option value="nodejs22.x">nodejs22.x</option>
              <option value="python3.12">python3.12</option>
              <option value="python3.13">python3.13</option>
            </select>
          </label>
        </>
      )}

      {Object.keys(form.formState.errors).length > 0 && (
        <p className="text-xs text-red-600">Fix validation errors to save.</p>
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
  const defaults = rel.configSchema.parse(edge.config) as FormValues;

  const form = useForm<FormValues>({
    resolver: zodResolver(rel.configSchema),
    defaultValues: defaults,
  });

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
              className="rounded border border-slate-200 px-2 py-1 text-sm"
              {...form.register("objectKeyPrefix")}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...form.register("includeListBucket")} />
            Include s3:ListBucket
          </label>
        </>
      )}

      {rel.id === "lambda_writes_s3" && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-700">Object key prefix</span>
          <input
            className="rounded border border-slate-200 px-2 py-1 text-sm"
            {...form.register("objectKeyPrefix")}
          />
        </label>
      )}

      {rel.id === "s3_triggers_lambda" && (
        <>
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-slate-700">Events</span>
            <S3EventsField form={form} />
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Prefix filter</span>
            <input
              className="rounded border border-slate-200 px-2 py-1 text-sm"
              {...form.register("prefix")}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700">Suffix filter</span>
            <input
              className="rounded border border-slate-200 px-2 py-1 text-sm"
              {...form.register("suffix")}
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
          Delete edge
        </button>
      </div>
    </form>
  );
}

function S3EventsField({ form }: { form: UseFormReturn<FormValues> }) {
  const events = (form.watch("events") as string[] | undefined) ?? [];
  const toggle = (value: string) => {
    const set = new Set(events);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    form.setValue("events", [...set], { shouldValidate: true });
  };

  return (
    <div className="flex flex-col gap-1">
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
    </div>
  );
}
