#!/usr/bin/env node
/**
 * Synthesize a CDK app from an aws-designer graph JSON file.
 *
 * Usage: npx tsx compiler/synth.ts <graph.json> [--outdir <dir>]
 * Default output: ./cdk.out
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { App } from "aws-cdk-lib";

import { validateGraph } from "../src/compile/validateGraph.ts";
import { graphFileToDocument, parseGraphFileJson } from "../src/graph/graphFile.ts";
import { GraphCompilerStack } from "./graphCompilerStack.ts";

function parseArgs(argv: string[]): { graphPath: string; outdir: string } {
  const rest = argv.slice(2);
  if (rest.length === 0) {
    console.error(
      "Usage: npx tsx compiler/synth.ts <graph.json> [--outdir <dir>]",
    );
    process.exit(1);
  }
  const graphPath = resolve(rest[0]);
  let outdir = "cdk.out";
  const od = rest.indexOf("--outdir");
  if (od !== -1 && rest[od + 1]) {
    outdir = resolve(rest[od + 1]);
  }
  return { graphPath, outdir };
}

const { graphPath, outdir } = parseArgs(process.argv);

const raw = JSON.parse(readFileSync(graphPath, "utf-8"));
const doc = graphFileToDocument(parseGraphFileJson(raw));

const validation = validateGraph(doc);
if (!validation.ok) {
  console.error("Graph validation failed:");
  for (const i of validation.issues) {
    console.error(`  [${i.code}] ${i.message}`);
  }
  process.exit(1);
}

const app = new App({ outdir });
new GraphCompilerStack(app, "DesignerGraphStack", {
  graph: doc,
  description: "Synthesized from aws_designer graph JSON",
});

app.synth();

console.error(`Synthesized templates to ${outdir}`);
