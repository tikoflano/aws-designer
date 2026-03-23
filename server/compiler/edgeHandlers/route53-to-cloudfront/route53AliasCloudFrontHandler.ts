import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";

import { NodeIds } from "../../nodeHandlers/nodeIds.ts";
import {
  route53NodeConfigSchema,
  route53RecordNameFromDomain,
} from "../../nodeHandlers/route53/route53Service.definition.ts";
import {
  route53AliasCloudFrontConfigSchema,
  route53AliasCloudFrontDefinition,
} from "./route53AliasCloudFront.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../types.ts";

function normalizeFqdn(d: string): string {
  return d.replace(/\.$/, "").toLowerCase();
}

export class Route53AliasCloudFrontHandler implements EdgeRelationshipHandler {
  public readonly definition = route53AliasCloudFrontDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    const edgeCfg = route53AliasCloudFrontConfigSchema.parse(edge.config);
    const nodeCfg = route53NodeConfigSchema.parse(sourceNode.config);
    const distribution = ctx.distributions.get(targetNode.id);
    if (!distribution) return;

    const domainRaw = edgeCfg.domainName.trim();
    const zoneRaw = nodeCfg.name.trim();
    const hostedZoneId = nodeCfg.hostedZoneId.trim();

    if (domainRaw === "" || zoneRaw === "" || hostedZoneId === "") {
      return;
    }

    const domainName = normalizeFqdn(domainRaw);
    const zoneName = zoneRaw.replace(/\.$/, "");
    const zone = route53.HostedZone.fromHostedZoneAttributes(
      ctx.stack,
      NodeIds.cfnId("R53Zone", sourceNode.id),
      {
        hostedZoneId,
        zoneName,
      },
    );

    const certificate = new acm.DnsValidatedCertificate(
      ctx.stack,
      NodeIds.cfnId("CfCert", edge.id),
      {
        domainName,
        hostedZone: zone,
        region: "us-east-1",
      },
    );

    const cfn = distribution.node.defaultChild as cloudfront.CfnDistribution;
    cfn.addPropertyOverride("DistributionConfig.Aliases", [domainName]);
    cfn.addPropertyOverride("DistributionConfig.ViewerCertificate", {
      AcmCertificateArn: certificate.certificateArn,
      SslSupportMethod: "sni-only",
      MinimumProtocolVersion: "TLSv1.2_2021",
    });

    new route53.ARecord(ctx.stack, NodeIds.cfnId("R53Alias", edge.id), {
      zone,
      recordName: route53RecordNameFromDomain(domainRaw, zoneRaw),
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution),
      ),
    });
  }
}
