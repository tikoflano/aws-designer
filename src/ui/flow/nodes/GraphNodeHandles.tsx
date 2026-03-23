import { Handle, Position } from "@xyflow/react";

/** Larger hit area on small screens; z-index so touches hit the handle, not the node drag layer. */
const HANDLE_CLASS =
  "z-[2] !h-3 !w-3 !border !border-slate-300 !bg-white max-md:!h-11 max-md:!w-11 max-md:!min-h-[44px] max-md:!min-w-[44px] max-md:!border-2";

export function GraphNodeHandles() {
  return (
    <>
      <Handle type="target" position={Position.Left} className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Right} className={HANDLE_CLASS} />
    </>
  );
}
