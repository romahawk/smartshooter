// src/components/badges/index.js
import * as PanelMod from "./BadgesPanel.jsx";

// Prefer the named export; fall back to default; else a safe placeholder.
const Resolved =
  PanelMod.BadgesPanel ||
  PanelMod.default ||
  function BadgesPanelFallback() {
    console.warn(
      "[BadgesPanel] export not found; rendering fallback. Check your BadgesPanel.jsx exports."
    );
    return null; // safe no-op to avoid crashing the dashboard
  };

export { Resolved as BadgesPanel };
export default Resolved;
