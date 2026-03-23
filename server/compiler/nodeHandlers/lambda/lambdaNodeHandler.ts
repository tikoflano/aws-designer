import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../graphCompileContext.ts";
import { NodeIds } from "../nodeIds.ts";
import type { NodeServiceHandler } from "../types.ts";
import {
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
    const fn = new lambda.Function(stack, NodeIds.cfnId("Fn", node.id), {
      functionName: cfg.functionName,
      runtime: rt,
      handler,
      code: lambdaInlineCode(rt),
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

function lambdaInlineCode(runtime: lambda.Runtime): lambda.Code {
  if (
    runtime === lambda.Runtime.PYTHON_3_12 ||
    runtime === lambda.Runtime.PYTHON_3_13
  ) {
    return lambda.Code.fromInline(
      "def lambda_handler(event, context):\n    return {}\n",
    );
  }
  return lambda.Code.fromInline(
    'exports.handler = async () => ({ statusCode: 200, body: "ok" });',
  );
}
