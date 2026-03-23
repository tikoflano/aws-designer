import type * as cdk from "aws-cdk-lib";

import type { ServiceDefinition } from "../domain/catalogTypes.ts";
import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../graphCompileContext.ts";

export interface NodeServiceHandler {
  readonly definition: ServiceDefinition;
  apply(stack: cdk.Stack, ctx: GraphCompileContext, node: GraphNode): void;
}
