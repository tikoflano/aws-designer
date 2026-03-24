import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const sqsSubscribesSnsFifoConfigSchema = z.object({});

export const sqsSubscribesSnsFifoDefinition: RelationshipDefinition = {
  id: "sqs_subscribes_sns_fifo",
  version: DEFINITION_VERSION_V1,
  name: "SQS subscribes to SNS (FIFO)",
  verb: "subscribes",
  description:
    "Subscribes the FIFO queue to the FIFO SNS topic (both must be FIFO). CDK adds an SNS subscription on the topic to the queue.",
  source: "sqs",
  target: "sns_fifo",
  configSchema: sqsSubscribesSnsFifoConfigSchema,
};
