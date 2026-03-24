import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const lambdaReadsSecretsManagerConfigSchema = z.object({});

export const lambdaReadsSecretsManagerDefinition: RelationshipDefinition = {
  id: "lambda_reads_secretsmanager",
  version: DEFINITION_VERSION_V1,
  name: "Lambda reads from Secrets Manager",
  verb: "reads",
  description:
    "Grants the Lambda execution role permission to read the target secret value.",
  source: "lambda",
  target: "secretsmanager",
  configSchema: lambdaReadsSecretsManagerConfigSchema,
};
