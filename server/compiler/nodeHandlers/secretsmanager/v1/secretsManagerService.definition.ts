import { z } from "zod";

import {
  SERVICE_VERSION,
  type ServiceDefinition,
} from "../../domain/catalogTypes.ts";
import type { ServiceId } from "../../domain/serviceId.ts";

/** AWS CreateSecret Name: letters, digits, path separators, and limited punctuation. */
const secretNameRegex = /^[a-zA-Z0-9/_+=.@,-]+$/;

export const secretsManagerNodeConfigSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Secret name is required." })
    .max(512, { message: "Secret name must be at most 512 characters." })
    .regex(secretNameRegex, {
      message:
        "Use only letters, numbers, and / _ + = . @ , - (AWS secret name rules).",
    }),
  secretKey: z
    .string()
    .min(1, { message: "Secret key is required." })
    .max(255, { message: "Secret key must be at most 255 characters." }),
  secretValue: z.string().default(""),
});

export const secretsManagerServiceDefinition: ServiceDefinition = {
  id: "secretsmanager" satisfies ServiceId,
  version: SERVICE_VERSION,
  displayName: "Secrets Manager",
  description:
    "Stores a key/value pair as an other-type secret (plain JSON payload).",
  configSchema: secretsManagerNodeConfigSchema,
};
