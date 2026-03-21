import { useGraphStore } from "../state/graphStore";
import { listRelationships } from "../registry/relationships";
import { CompilePanel } from "./CompilePanel";
import { FlowCanvas } from "./flow/FlowCanvas";
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
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <div>
          <h1 className="text-sm font-semibold">AWS Designer · MVP</h1>
          <p className="text-xs text-slate-600">
            S3 and Lambda only — three curated relationships.
          </p>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-row">
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
