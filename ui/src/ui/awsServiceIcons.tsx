import ArchitectureServiceAmazonCloudFront from "aws-react-icons/icons/ArchitectureServiceAmazonCloudFront";
import ArchitectureServiceAmazonRoute53 from "aws-react-icons/icons/ArchitectureServiceAmazonRoute53";
import ArchitectureServiceAmazonSimpleStorageService from "aws-react-icons/icons/ArchitectureServiceAmazonSimpleStorageService";
import ArchitectureServiceAWSLambda from "aws-react-icons/icons/ArchitectureServiceAWSLambda";
import ArchitectureServiceAmazonSimpleNotificationService from "aws-react-icons/icons/ArchitectureServiceAmazonSimpleNotificationService";
import ArchitectureServiceAmazonSimpleQueueService from "aws-react-icons/icons/ArchitectureServiceAmazonSimpleQueueService";
import ArchitectureServiceAWSSecretsManager from "aws-react-icons/icons/ArchitectureServiceAWSSecretsManager";

import type { ServiceId } from "../domain/types";

const DEFAULT_SIZE = 48;

export function AwsServiceArchitectureIcon({
  serviceId,
  size = DEFAULT_SIZE,
  className,
}: {
  serviceId: ServiceId;
  size?: number;
  className?: string;
}) {
  const svgClass = ["pointer-events-none", className].filter(Boolean).join(" ");
  switch (serviceId) {
    case "lambda":
      return (
        <ArchitectureServiceAWSLambda
          size={size}
          className={svgClass}
          aria-hidden
        />
      );
    case "s3":
      return (
        <ArchitectureServiceAmazonSimpleStorageService
          size={size}
          className={svgClass}
          aria-hidden
        />
      );
    case "cloudfront":
      return (
        <ArchitectureServiceAmazonCloudFront
          size={size}
          className={svgClass}
          aria-hidden
        />
      );
    case "route53":
      return (
        <ArchitectureServiceAmazonRoute53
          size={size}
          className={svgClass}
          aria-hidden
        />
      );
    case "secretsmanager":
      return (
        <ArchitectureServiceAWSSecretsManager
          size={size}
          className={svgClass}
          aria-hidden
        />
      );
    case "sns":
      return (
        <ArchitectureServiceAmazonSimpleNotificationService
          size={size}
          className={svgClass}
          aria-hidden
        />
      );
    case "sqs":
      return (
        <ArchitectureServiceAmazonSimpleQueueService
          size={size}
          className={svgClass}
          aria-hidden
        />
      );
  }
}
