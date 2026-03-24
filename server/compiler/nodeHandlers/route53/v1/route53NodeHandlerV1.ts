import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../../graphCompileContext.ts";
import { NodeIds } from "../../nodeIds.ts";
import type { NodeServiceHandler } from "../../types.ts";
import {
  route53NodeConfigSchema,
  route53ServiceDefinition,
} from "./route53Service.definition.ts";

export class Route53NodeHandlerV1 implements NodeServiceHandler {
  public readonly definition = route53ServiceDefinition;

  public apply(stack: cdk.Stack, ctx: GraphCompileContext, node: GraphNode): void {
    const cfg = route53NodeConfigSchema.parse(node.config);
    const zoneName = cfg.name.trim().replace(/\.$/, "");
    if (zoneName === "") {
      return;
    }
    if (cfg.type === "public") {
      const zone = new route53.PublicHostedZone(stack, NodeIds.cfnId("R53Zone", node.id), {
        zoneName,
      });
      ctx.hostedZones.set(node.id, zone);
    }
  }
}
