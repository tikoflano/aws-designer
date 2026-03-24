function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function distAt(
  el: SVGPathElement,
  s: number,
  x: number,
  y: number,
): number {
  const pt = el.getPointAtLength(s);
  return distSq(pt.x, pt.y, x, y);
}

export function clampLabelAlongPathT(t: number): number {
  if (!Number.isFinite(t)) return 0.5;
  return Math.min(1, Math.max(0, t));
}

/**
 * Returns t in [0,1] such that path point at t*length is closest to (x,y) in flow space.
 */
export function flowPointToPathT(pathD: string, x: number, y: number): number {
  if (typeof document === "undefined") return 0.5;
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", pathD);
  const len =
    typeof el.getTotalLength === "function" ? el.getTotalLength() : 0;
  if (!Number.isFinite(len) || len <= 0) return 0.5;

  let bestS = 0;
  let bestD = Infinity;
  const steps = Math.min(256, Math.max(48, Math.ceil(len / 3)));
  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * len;
    const d = distAt(el, s, x, y);
    if (d < bestD) {
      bestD = d;
      bestS = s;
    }
  }
  let lo = Math.max(0, bestS - len / steps);
  let hi = Math.min(len, bestS + len / steps);
  for (let k = 0; k < 20; k++) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    const d1 = distAt(el, m1, x, y);
    const d2 = distAt(el, m2, x, y);
    if (d1 < d2) hi = m2;
    else lo = m1;
  }
  return clampLabelAlongPathT(((lo + hi) / 2) / len);
}

export function pointOnPathAtT(
  pathD: string,
  t: number,
  fallback: { x: number; y: number },
): { x: number; y: number } {
  const cl = clampLabelAlongPathT(t);
  if (typeof document === "undefined") return fallback;
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", pathD);
  const len =
    typeof el.getTotalLength === "function" ? el.getTotalLength() : 0;
  if (!Number.isFinite(len) || len <= 0) return fallback;
  return el.getPointAtLength(cl * len);
}

/** t in [0,1] for the point on the path closest to React Flow's default label anchor. */
export function defaultLabelTFromRfAnchor(
  pathD: string,
  labelX: number,
  labelY: number,
): number {
  return flowPointToPathT(pathD, labelX, labelY);
}
