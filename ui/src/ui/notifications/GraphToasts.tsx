import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useGraphStore } from "../../state/graphStore";

/**
 * Subscribes to server save lifecycle and shows toasts (save is triggered from the graph menu).
 */
export function GraphToasts() {
  const prevSaveStatus = useRef(useGraphStore.getState().saveStatus);

  useEffect(() => {
    return useGraphStore.subscribe((state) => {
      const prev = prevSaveStatus.current;
      const { saveStatus, saveError, serverVersion } = state;

      if (saveStatus === "saved" && prev !== "saved") {
        const v =
          typeof serverVersion === "number" ? ` (version ${serverVersion})` : "";
        toast.success(`Graph saved${v}`);
      } else if (saveStatus === "error" && prev !== "error") {
        toast.error(saveError ?? "Could not save graph");
      }

      prevSaveStatus.current = saveStatus;
    });
  }, []);

  return null;
}
