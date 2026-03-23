import type * as cdk from "aws-cdk-lib";
import type * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import type * as lambda from "aws-cdk-lib/aws-lambda";
import type * as s3 from "aws-cdk-lib/aws-s3";
import type * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export type GraphCompileContext = {
  stack: cdk.Stack;
  buckets: Map<string, s3.Bucket>;
  functions: Map<string, lambda.Function>;
  distributions: Map<string, cloudfront.Distribution>;
  secrets: Map<string, secretsmanager.ISecret>;
};
