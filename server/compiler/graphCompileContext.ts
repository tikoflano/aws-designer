import type * as lambda from "aws-cdk-lib/aws-lambda";
import type * as s3 from "aws-cdk-lib/aws-s3";

export type GraphCompileContext = {
  buckets: Map<string, s3.Bucket>;
  functions: Map<string, lambda.Function>;
};
