import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../../graphCompileContext.ts";
import { NodeIds } from "../../nodeIds.ts";
import type { NodeServiceHandler } from "../../types.ts";
import { absolutePathToLambdaDeploymentZip } from "../../../lambdaZipPaths.ts";
import {
  defaultInlineSourceForRuntime,
  lambdaNodeConfigSchema,
  lambdaServiceDefinition,
} from "./lambdaService.definition.ts";

export class LambdaNodeHandlerV1 implements NodeServiceHandler {
  public readonly definition = lambdaServiceDefinition;

  public apply(stack: cdk.Stack, ctx: GraphCompileContext, node: GraphNode): void {
    const cfg = lambdaNodeConfigSchema.parse(node.config);
    const rt = mapRuntime(cfg.runtime);
    const handler = cfg.runtime.startsWith("python")
      ? "lambda_function.lambda_handler"
      : cfg.handler;
    const envKeys = Object.keys(cfg.environmentVariables);

    let code: lambda.Code;
    if (cfg.codeSource.type === "uploadedZip") {
      const lz = ctx.lambdaZipCompile;
      if (!lz?.graphId || !lz.lambdaZipAssetsRoot) {
        throw new Error(
          `Lambda "${node.id}": uploaded zip requires graph compile context (graphId and lambdaZipAssetsRoot).`,
        );
      }
      const zipPath = absolutePathToLambdaDeploymentZip(
        lz.lambdaZipAssetsRoot,
        lz.graphId,
        node.id,
      );
      code = lambda.Code.fromAsset(zipPath);
    } else {
      const inline = cfg.codeSource.inlineSource?.trim();
      const source =
        inline && inline.length > 0
          ? inline
          : defaultInlineSourceForRuntime(cfg.runtime);
      code = lambda.Code.fromInline(source);
    }

    const fn = new lambda.Function(stack, NodeIds.cfnId("Fn", node.id), {
      functionName: cfg.functionName,
      runtime: rt,
      handler,
      code,
      memorySize: cfg.memorySizeMb,
      ephemeralStorageSize: cdk.Size.mebibytes(cfg.ephemeralStorageMb),
      timeout: cdk.Duration.seconds(cfg.timeoutSeconds),
      environment:
        envKeys.length > 0 ? { ...cfg.environmentVariables } : undefined,
    });
    fn.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole",
      ),
    );
    ctx.functions.set(node.id, fn);
  }
}

function mapRuntime(runtime: string): lambda.Runtime {
  const m: Record<string, lambda.Runtime> = {
    "nodejs18.x": lambda.Runtime.NODEJS_18_X,
    "nodejs20.x": lambda.Runtime.NODEJS_20_X,
    "nodejs22.x": lambda.Runtime.NODEJS_22_X,
    "python3.12": lambda.Runtime.PYTHON_3_12,
    "python3.13": lambda.Runtime.PYTHON_3_13,
  };
  return m[runtime] ?? lambda.Runtime.NODEJS_20_X;
}
