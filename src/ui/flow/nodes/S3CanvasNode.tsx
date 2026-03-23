import { GraphNodeHandles } from "./GraphNodeHandles";

type Props = {
  data: { title: string; subtitle: string };
  selected?: boolean;
};

export function S3CanvasNode({ data, selected }: Props) {
  return (
    <div
      className={`min-w-[140px] rounded-lg border bg-white px-3 py-2 shadow-sm ${
        selected ? "border-amber-500 ring-2 ring-amber-200" : "border-slate-200"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        S3
      </div>
      <div className="text-sm font-medium text-slate-900">{data.title}</div>
      <div className="text-xs text-slate-500">{data.subtitle}</div>
      <GraphNodeHandles />
    </div>
  );
}
