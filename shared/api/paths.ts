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
  graphLambdaZip: (graphId: string, nodeId: string) =>
    `/api/graph/${encodeURIComponent(graphId)}/nodes/${encodeURIComponent(nodeId)}/lambda-zip`,
  postGraph: "/api/graph",
} as const;
