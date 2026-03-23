/** Path segments under the API prefix (no trailing slash). */
export const apiPaths = {
  graphs: "/api/graphs",
  graph: (id: string) => `/api/graph/${encodeURIComponent(id)}`,
  graphVersions: (id: string) =>
    `/api/graph/${encodeURIComponent(id)}/versions`,
  graphVersion: (id: string, versionId: number | string) =>
    `/api/graph/${encodeURIComponent(id)}/versions/${encodeURIComponent(String(versionId))}`,
  graphCompiled: (id: string) =>
    `/api/graph/${encodeURIComponent(id)}/compiled`,
  postGraph: "/api/graph",
} as const;
