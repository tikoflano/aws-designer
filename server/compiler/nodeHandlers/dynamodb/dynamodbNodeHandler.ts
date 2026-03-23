import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../graphCompileContext.ts";
import { NodeIds } from "../nodeIds.ts";
import type { NodeServiceHandler } from "../types.ts";
import {
  dynamodbServiceDefinition,
  dynamodbTableNodeConfigSchema,
} from "./dynamodbService.definition.ts";

function mapAttrType(
  t: "string" | "number" | "binary",
): dynamodb.AttributeType {
  switch (t) {
    case "number":
      return dynamodb.AttributeType.NUMBER;
    case "binary":
      return dynamodb.AttributeType.BINARY;
    default:
      return dynamodb.AttributeType.STRING;
  }
}

export class DynamodbNodeHandler implements NodeServiceHandler {
  public readonly definition = dynamodbServiceDefinition;

  public apply(stack: cdk.Stack, ctx: GraphCompileContext, node: GraphNode): void {
    const cfg = dynamodbTableNodeConfigSchema.parse(node.config);
    const pkType = cfg.partitionKeyType ?? "string";
    const sortKeyName =
      "sortKeyName" in cfg ? String(cfg.sortKeyName ?? "").trim() : "";
    const sortKeyType =
      "sortKeyType" in cfg ? cfg.sortKeyType : undefined;
    const sortKey =
      sortKeyName !== "" && sortKeyType !== undefined
        ? {
            name: sortKeyName,
            type: mapAttrType(sortKeyType),
          }
        : undefined;

    const table = new dynamodb.Table(stack, NodeIds.cfnId("DdbTable", node.id), {
      tableName: cfg.name,
      partitionKey: {
        name: cfg.partitionKeyName,
        type: mapAttrType(pkType),
      },
      ...(sortKey ? { sortKey } : {}),
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });
    ctx.dynamoTables.set(node.id, table);
  }
}
