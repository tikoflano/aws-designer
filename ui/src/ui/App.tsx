import { useState } from "react";
import { Toaster } from "sonner";

import { useGraphStore } from "../state/graphStore";
import { listRelationships } from "@compiler/catalog.ts";
import { FlowCanvas } from "./flow/FlowCanvas";
import { InspectorPanel } from "./inspector/InspectorPanel";
import { GraphToasts } from "./notifications/GraphToasts";
import { ServicePalette } from "./palette/ServicePalette";
import { RelationshipPicker } from "./relationship/RelationshipPicker";

export function App() {
  const [servicePaletteOpen, setServicePaletteOpen] = useState(true);

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
      <Toaster
        position="bottom-right"
        theme="light"
        closeButton
        toastOptions={{
          classNames: {
            // Sonner injects background/border on [data-styled]; ! overrides so header-matching orange shows through.
            toast:
              "!border-2 !border-orange-400 !bg-linear-to-r !from-orange-300 !to-amber-200 !text-orange-950 !shadow-lg",
            title: "!text-orange-950",
            description: "!text-orange-950/80",
            icon: "!text-orange-900",
            closeButton:
              "!border !border-orange-400/60 !bg-white/50 !text-orange-950 hover:!bg-white/80",
            success: "!border-orange-500",
            error:
              "!border-orange-800 !from-orange-200 !to-amber-100",
          },
        }}
      />
      <GraphToasts />
      <header className="border-b-2 border-orange-400 bg-linear-to-r from-orange-300 to-amber-200 px-4 py-2.5 shadow-sm">
        <h1 className="text-sm font-semibold text-orange-950">
          AWS Designer - Untitled
        </h1>
      </header>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
        {servicePaletteOpen ? <ServicePalette /> : null}
        <FlowCanvas
          servicePaletteOpen={servicePaletteOpen}
          onToggleServicePalette={() =>
            setServicePaletteOpen((open) => !open)
          }
        />
        <InspectorPanel />
      </div>
      <RelationshipPicker
        open={Boolean(pendingConnection)}
        fromServiceId={sourceNode?.serviceId}
        toServiceId={targetNode?.serviceId}
        relationships={options}
        onCancel={() => cancelPendingConnection()}
        onSelect={(relationshipId) => confirmRelationship(relationshipId)}
      />
    </div>
  );
}
