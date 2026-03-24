import { z } from "zod";

import {
  RELATIONSHIP_VERSION,
  type RelationshipDefinition,
} from "../../domain/catalogTypes.ts";

export const lambdaWritesSecretsManagerConfigSchema = z.object({});

export const lambdaWritesSecretsManagerDefinition: RelationshipDefinition = {
  id: "lambda_writes_secretsmanager",
  version: RELATIONSHIP_VERSION,
  name: "Lambda writes to Secrets Manager",
  verb: "writes",
  description:
    "Grants the Lambda execution role permission to create and update the target secret.",
  source: "lambda",
  target: "secretsmanager",
  configSchema: lambdaWritesSecretsManagerConfigSchema,
};
