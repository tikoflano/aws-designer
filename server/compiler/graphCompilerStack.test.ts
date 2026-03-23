import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";

import { graphFileToDocument, parseGraphFileJson } from "../../ui/src/graph/graphFile.ts";
import { GraphCompilerStack } from "./graphCompilerStack.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("GraphCompilerStack", () => {
  it("synthesizes bucket, function, and policies for lambda_reads_s3 fixture", () => {
    const raw = JSON.parse(
      readFileSync(join(__dirname, "fixtures/lambda-reads-s3.json"), "utf-8"),
    );
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "FixtureStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::S3::Bucket", 1);
    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.resourceCountIs("AWS::IAM::Policy", 1);
  });

  it("embeds custom lambda inlineSource in the synthesized template", () => {
    const marker = "exports.handler = async () => ({ statusCode: 418 });";
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: "1.0.0",
          position: { x: 0, y: 0 },
          config: {
            functionName: "customInlineFn",
            inlineSource: marker,
          },
        },
      ],
      edges: [],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "InlineSourceStack", { graph: doc });
    const template = Template.fromStack(stack);

    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("418");
  });
});
