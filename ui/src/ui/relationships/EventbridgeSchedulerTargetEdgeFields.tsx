import { RelationshipIds } from "@compiler/catalog.ts";

import { useGraphStore } from "../../state/graphStore";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import type { EdgeConfigFieldsProps } from "./types";

export function EventbridgeSchedulerTargetEdgeFields({
  formId,
  edge,
  form,
}: EdgeConfigFieldsProps) {
  const {
    register,
    formState: { errors },
  } = form;
  const nodes = useGraphStore((s) => s.nodes);
  const target = nodes.find((n) => n.id === edge.targetNodeId);
  const showFifoGroupId =
    edge.relationshipId === RelationshipIds.eventbridge_scheduler_sends_sqs &&
    target?.serviceId === "sqs" &&
    String((target.config as { queueType?: string }).queueType ?? "") === "fifo";

  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Target input (JSON)</span>
        <span className="text-xs text-slate-500">
          Optional. Empty uses the scheduler default payload. Must be valid JSON when set.
        </span>
        <textarea
          className={`min-h-[5rem] rounded border px-2 py-1 font-mono text-sm ${
            errors.input ? "border-red-300" : "border-slate-200"
          }`}
          rows={5}
          placeholder='{"key":"value"}'
          aria-invalid={errors.input ? true : undefined}
          aria-describedby={
            errors.input?.message ? fieldErrorId(formId, "input") : undefined
          }
          {...register("input")}
        />
        <FieldError
          baseId={formId}
          field="input"
          message={errors.input?.message as string | undefined}
        />
      </label>

      {showFifoGroupId && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-700">FIFO message group ID</span>
          <span className="text-xs text-slate-500">
            Required for FIFO queues (1–128 characters).
          </span>
          <input
            className={`rounded border px-2 py-1 text-sm ${
              errors.messageGroupId ? "border-red-300" : "border-slate-200"
            }`}
            aria-invalid={errors.messageGroupId ? true : undefined}
            aria-describedby={
              errors.messageGroupId?.message
                ? fieldErrorId(formId, "messageGroupId")
                : undefined
            }
            {...register("messageGroupId")}
          />
          <FieldError
            baseId={formId}
            field="messageGroupId"
            message={errors.messageGroupId?.message as string | undefined}
          />
        </label>
      )}
    </>
  );
}
