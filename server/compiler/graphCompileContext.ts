import type * as cdk from "aws-cdk-lib";
import type * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import type * as lambda from "aws-cdk-lib/aws-lambda";
import type * as route53 from "aws-cdk-lib/aws-route53";
import type * as s3 from "aws-cdk-lib/aws-s3";
import type * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type * as sns from "aws-cdk-lib/aws-sns";
import type * as sqs from "aws-cdk-lib/aws-sqs";

export type LambdaZipCompileContext = {
  graphId: string;
  lambdaZipAssetsRoot: string;
};

export type GraphCompileContext = {
  stack: cdk.Stack;
  /** When set, Lambda nodes with `uploadedZip` resolve zips under this directory. */
  lambdaZipCompile?: LambdaZipCompileContext;
  buckets: Map<string, s3.Bucket>;
  functions: Map<string, lambda.Function>;
  distributions: Map<string, cloudfront.Distribution>;
  hostedZones: Map<string, route53.IHostedZone>;
  secrets: Map<string, secretsmanager.ISecret>;
  snsTopics: Map<string, sns.ITopic>;
  sqsQueues: Map<string, sqs.IQueue>;
  dynamoTables: Map<string, dynamodb.ITable>;
};
