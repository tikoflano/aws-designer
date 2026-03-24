import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";

import type { GraphEdge, GraphNode } from "../../domain/types";
import {
  getRelationship,
  getService,
  type RelationshipDefinition,
  type ServiceDefinition,
} from "@compiler/catalog.ts";
import { useGraphStore } from "../../state/graphStore";
import { getUiRelationshipModule } from "../relationships/registry";
import { getUiServiceModule } from "../services/registry";
import type { FormValues } from "../services/types";

function nodeInspectorFormDefaults(
  node: GraphNode,
  svc: ServiceDefinition,
): FormValues {
  const result = svc.configSchema.safeParse(node.config);
  const base = (
    result.success ? result.data : { ...node.config }
  ) as FormValues;
  const mod = getUiServiceModule(node.serviceId, node.serviceVersion);
  return mod?.inspectorFormDefaults?.(node, base, svc) ?? base;
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
  const serverGraphId = useGraphStore((s) => s.serverGraphId);
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
            serverGraphId={serverGraphId}
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
  serverGraphId,
  onSave,
  onRemove,
}: {
  node: GraphNode;
  serverGraphId: string | null;
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
      serverGraphId={serverGraphId}
      onSave={onSave}
      onRemove={onRemove}
    />
  );
}

function NodeInspectorForm({
  node,
  svc,
  serverGraphId,
  onSave,
  onRemove,
}: {
  node: GraphNode;
  svc: ServiceDefinition;
  serverGraphId: string | null;
  onSave: (config: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const formId = useId();
  const defaults = nodeInspectorFormDefaults(node, svc);
  const uiMod = getUiServiceModule(node.serviceId, node.serviceVersion);

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

  useEffect(() => {
    form.reset(nodeInspectorFormDefaults(node, svc));
    // Omit `form`: useForm’s return object is not referentially stable; listing it re-runs
    // this effect every render and clears in-progress inspector edits.
  }, [node.id, node.serviceVersion, node.config, svc]); // eslint-disable-line react-hooks/exhaustive-deps

  const InspectorFields = uiMod?.InspectorFields;

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

      {InspectorFields ? (
        <InspectorFields
          formId={formId}
          node={node}
          svc={svc}
          serverGraphId={serverGraphId}
          register={register}
          control={control}
          errors={errors}
          getValues={getValues}
          setValue={setValue}
        />
      ) : (
        <p className="text-sm text-amber-800">
          No inspector UI is registered for this service version.
        </p>
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

  useEffect(() => {
    form.reset(rel.configSchema.parse(edge.config) as FormValues);
    // Omit `form`: useForm’s return object is not referentially stable; listing it re-runs
    // this effect every render and clears in-progress inspector edits.
  }, [edge.id, edge.relationshipVersion, edge.config, rel]); // eslint-disable-line react-hooks/exhaustive-deps

  const relUi = getUiRelationshipModule(
    edge.relationshipId,
    edge.relationshipVersion,
  );
  const EdgeFields = relUi?.EdgeConfigFields;

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

      {EdgeFields ? (
        <EdgeFields formId={formId} edge={edge} rel={rel} form={form} />
      ) : null}

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
