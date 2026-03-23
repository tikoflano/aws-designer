import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { hydrateDraftFromStorage, useGraphStore } from "./state/graphStore";
import { App } from "./ui/App";
import "./index.css";

const draft = hydrateDraftFromStorage();
if (draft) {
  useGraphStore.setState(draft);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
