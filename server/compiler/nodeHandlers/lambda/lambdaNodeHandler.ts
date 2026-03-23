import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../graphCompileContext.ts";
import { NodeIds } from "../nodeIds.ts";
import type { NodeServiceHandler } from "../types.ts";
import {
  defaultInlineSourceForRuntime,
  lambdaNodeConfigSchema,
  lambdaServiceDefinition,
} from "./lambdaService.definition.ts";

export class LambdaNodeHandler implements NodeServiceHandler {
  public readonly definition = lambdaServiceDefinition;

  public apply(stack: cdk.Stack, ctx: GraphCompileContext, node: GraphNode): void {
    const cfg = lambdaNodeConfigSchema.parse(node.config);
    const rt = mapRuntime(cfg.runtime);
    const handler = cfg.runtime.startsWith("python")
      ? "lambda_function.lambda_handler"
      : cfg.handler;
    const inline = cfg.inlineSource?.trim();
    const source =
      inline && inline.length > 0
        ? inline
        : defaultInlineSourceForRuntime(cfg.runtime);
    const fn = new lambda.Function(stack, NodeIds.cfnId("Fn", node.id), {
      functionName: cfg.functionName,
      runtime: rt,
      handler,
      code: lambda.Code.fromInline(source),
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
