import { z } from "zod";

import {
  RELATIONSHIP_VERSION,
  type RelationshipDefinition,
} from "../../domain/catalogTypes.ts";

export const lambdaReadsSecretsManagerConfigSchema = z.object({});

export const lambdaReadsSecretsManagerDefinition: RelationshipDefinition = {
  id: "lambda_reads_secretsmanager",
  version: RELATIONSHIP_VERSION,
  name: "Lambda reads from Secrets Manager",
  description:
    "Grants the Lambda execution role permission to read the target secret value.",
  source: "lambda",
  target: "secretsmanager",
  configSchema: lambdaReadsSecretsManagerConfigSchema,
};
