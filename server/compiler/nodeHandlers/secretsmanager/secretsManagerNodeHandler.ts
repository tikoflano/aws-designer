import * as cdk from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../graphCompileContext.ts";
import { NodeIds } from "../nodeIds.ts";
import type { NodeServiceHandler } from "../types.ts";
import {
  secretsManagerNodeConfigSchema,
  secretsManagerServiceDefinition,
} from "./secretsManagerService.definition.ts";

export class SecretsManagerNodeHandler implements NodeServiceHandler {
  public readonly definition = secretsManagerServiceDefinition;

  public apply(stack: cdk.Stack, _ctx: GraphCompileContext, node: GraphNode): void {
    const cfg = secretsManagerNodeConfigSchema.parse(node.config);
    const key = cfg.secretKey.trim();
    new secretsmanager.Secret(stack, NodeIds.cfnId("Secret", node.id), {
      secretName: cfg.name.trim(),
      description: "Other type of secret (key/value from graph)",
      secretObjectValue: {
        [key]: cdk.SecretValue.unsafePlainText(cfg.secretValue),
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
