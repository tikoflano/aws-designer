import { HelpInfoPopover } from "../common/HelpInfoPopover";
import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import { S3EventsField } from "./S3EventsField";
import type { EdgeConfigFieldsProps } from "./types";

export function LambdaReadsS3EdgeFields({
  formId,
  form,
}: EdgeConfigFieldsProps) {
  const { register, formState: { errors } } = form;
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Object key prefix</span>
        <input
          className={`rounded border px-2 py-1 text-sm ${
            errors.objectKeyPrefix ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.objectKeyPrefix ? true : undefined}
          aria-describedby={
            errors.objectKeyPrefix?.message
              ? fieldErrorId(formId, "objectKeyPrefix")
              : undefined
          }
          {...register("objectKeyPrefix")}
        />
        <FieldError
          baseId={formId}
          field="objectKeyPrefix"
          message={errors.objectKeyPrefix?.message}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register("includeListBucket")} />
        Include s3:ListBucket
      </label>
    </>
  );
}

export function LambdaWritesS3EdgeFields({
  formId,
  form,
}: EdgeConfigFieldsProps) {
  const { register, formState: { errors } } = form;
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-700">Object key prefix</span>
      <input
        className={`rounded border px-2 py-1 text-sm ${
          errors.objectKeyPrefix ? "border-red-300" : "border-slate-200"
        }`}
        aria-invalid={errors.objectKeyPrefix ? true : undefined}
        aria-describedby={
          errors.objectKeyPrefix?.message
            ? fieldErrorId(formId, "objectKeyPrefix")
            : undefined
        }
        {...register("objectKeyPrefix")}
      />
      <FieldError
        baseId={formId}
        field="objectKeyPrefix"
        message={errors.objectKeyPrefix?.message}
      />
    </label>
  );
}

export function S3TriggersLambdaEdgeFields({
  formId,
  form,
}: EdgeConfigFieldsProps) {
  const { register, formState: { errors } } = form;
  return (
    <>
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-slate-700">Events</span>
        <span className="text-xs text-slate-500">
          Select at least one event type.
        </span>
        <S3EventsField
          form={form}
          baseId={formId}
          eventsError={errors.events?.message}
        />
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="font-medium text-slate-700">
          Prefix and suffix filters
        </span>
        <HelpInfoPopover
          ariaLabel="About S3 prefix and suffix filters"
          title="S3 notification filters"
        >
          <p>
            Optional limits on which object keys trigger Lambda for the
            events you selected. Leave both blank to react to any key in the
            bucket.
          </p>
          <p>
            <span className="font-medium text-slate-800">Prefix</span> —
            only keys that{" "}
            <span className="font-medium text-slate-800">start</span> with
            this value. Example:{" "}
            <code className="rounded bg-slate-100 px-1 font-mono text-xs">
              uploads/
            </code>{" "}
            for objects under that path.
          </p>
          <p>
            <span className="font-medium text-slate-800">Suffix</span> —
            only keys that{" "}
            <span className="font-medium text-slate-800">end</span> with
            this value. Example:{" "}
            <code className="rounded bg-slate-100 px-1 font-mono text-xs">
              .json
            </code>
            .
          </p>
          <p>
            If both are set, the key must match both. That matches
            AWS S3 event notification filter behavior.
          </p>
        </HelpInfoPopover>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Prefix filter</span>
        <input
          className={`rounded border px-2 py-1 text-sm ${
            errors.prefix ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.prefix ? true : undefined}
          aria-describedby={
            errors.prefix?.message ? fieldErrorId(formId, "prefix") : undefined
          }
          {...register("prefix")}
        />
        <FieldError
          baseId={formId}
          field="prefix"
          message={errors.prefix?.message}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Suffix filter</span>
        <input
          className={`rounded border px-2 py-1 text-sm ${
            errors.suffix ? "border-red-300" : "border-slate-200"
          }`}
          aria-invalid={errors.suffix ? true : undefined}
          aria-describedby={
            errors.suffix?.message ? fieldErrorId(formId, "suffix") : undefined
          }
          {...register("suffix")}
        />
        <FieldError
          baseId={formId}
          field="suffix"
          message={errors.suffix?.message}
        />
      </label>
    </>
  );
}

export function CloudFrontOriginS3EdgeFields({
  formId,
  form,
}: EdgeConfigFieldsProps) {
  const { register, formState: { errors } } = form;
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-700">Origin path (optional)</span>
      <span className="text-xs text-slate-500">
        Prefix within the bucket served as the root, e.g.{" "}
        <code className="rounded bg-slate-100 px-1 font-mono">static</code>
      </span>
      <input
        className={`rounded border px-2 py-1 text-sm ${
          errors.originPath ? "border-red-300" : "border-slate-200"
        }`}
        aria-invalid={errors.originPath ? true : undefined}
        aria-describedby={
          errors.originPath?.message
            ? fieldErrorId(formId, "originPath")
            : undefined
        }
        {...register("originPath")}
      />
      <FieldError
        baseId={formId}
        field="originPath"
        message={errors.originPath?.message}
      />
    </label>
  );
}

export function Route53AliasCloudFrontEdgeFields({
  formId,
  form,
}: EdgeConfigFieldsProps) {
  const { register, formState: { errors } } = form;
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-700">Domain name (FQDN)</span>
      <span className="text-xs text-slate-500">
        Alias and TLS name for CloudFront, e.g. www.example.com or the zone
        apex. Must sit under the hosted zone on the Route 53 node; ACM issues
        a certificate automatically via DNS validation.
      </span>
      <input
        className={`rounded border px-2 py-1 text-sm ${
          errors.domainName ? "border-red-300" : "border-slate-200"
        }`}
        aria-invalid={errors.domainName ? true : undefined}
        aria-describedby={
          errors.domainName?.message
            ? fieldErrorId(formId, "domainName")
            : undefined
        }
        {...register("domainName")}
      />
      <FieldError
        baseId={formId}
        field="domainName"
        message={errors.domainName?.message}
      />
    </label>
  );
}
