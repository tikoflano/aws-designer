import { Handle, Position } from "@xyflow/react";

type Props = {
  data: { title: string; subtitle: string };
  selected?: boolean;
};

export function LambdaCanvasNode({ data, selected }: Props) {
  return (
    <div
      className={`min-w-[160px] rounded-lg border bg-white px-3 py-2 shadow-sm ${
        selected ? "border-violet-500 ring-2 ring-violet-200" : "border-slate-200"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">
        Lambda
      </div>
      <div className="text-sm font-medium text-slate-900">{data.title}</div>
      <div className="text-xs text-slate-500">{data.subtitle}</div>
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border !border-slate-300 !bg-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border !border-slate-300 !bg-white"
      />
    </div>
  );
}
