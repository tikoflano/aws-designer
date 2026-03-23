import { useGraphStore } from "../state/graphStore";
import { listRelationships } from "../registry/relationships";
import { CompilePanel } from "./CompilePanel";
import { FlowCanvas } from "./flow/FlowCanvas";
import { GraphToolbar } from "./GraphToolbar";
import { InspectorPanel } from "./inspector/InspectorPanel";
import { ServicePalette } from "./palette/ServicePalette";
import { RelationshipPicker } from "./relationship/RelationshipPicker";

export function App() {
  const pendingConnection = useGraphStore((s) => s.pendingConnection);
  const nodes = useGraphStore((s) => s.nodes);
  const cancelPendingConnection = useGraphStore((s) => s.cancelPendingConnection);
  const confirmRelationship = useGraphStore((s) => s.confirmRelationship);

  const sourceNode = pendingConnection
    ? nodes.find((n) => n.id === pendingConnection.sourceNodeId)
    : undefined;
  const targetNode = pendingConnection
    ? nodes.find((n) => n.id === pendingConnection.targetNodeId)
    : undefined;

  const options =
    sourceNode && targetNode
      ? listRelationships(sourceNode.serviceId, targetNode.serviceId)
      : [];

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2">
        <div>
          <h1 className="text-sm font-semibold">AWS Designer · MVP</h1>
          <p className="hidden text-xs text-slate-600 md:block">
            S3 and Lambda — three relationships. Run <code className="rounded bg-slate-100 px-1">npm run server:dev</code>{" "}
            for the API; the UI proxies <code className="rounded bg-slate-100 px-1">/api</code>. Draft edits
            stay in local storage; <strong>Save to server</strong> syncs to SQLite (versioned).
          </p>
        </div>
        <GraphToolbar />
      </header>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
        <ServicePalette />
        <FlowCanvas />
        <InspectorPanel />
      </div>
      <CompilePanel />
      <RelationshipPicker
        open={Boolean(pendingConnection)}
        relationships={options}
        onCancel={() => cancelPendingConnection()}
        onSelect={(relationshipId) => confirmRelationship(relationshipId)}
      />
    </div>
  );
}
