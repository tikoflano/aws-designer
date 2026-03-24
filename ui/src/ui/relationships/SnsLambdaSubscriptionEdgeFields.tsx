import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormReturn,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { fieldErrorId } from "../inspector/formFieldIds";
import { FieldError } from "../inspector/formUtils";
import type { FormValues } from "../services/types";
import type { EdgeConfigFieldsProps } from "./types";

type SubscriptionFilterKind = "none" | "messageAttributes" | "messageBody";

type LeafKind = "string" | "numeric" | "exists" | "notExists";

function commaSeparatedStringToArray(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function commaSeparatedNumberToArray(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => {
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    })
    .filter((n) => !Number.isNaN(n));
}

function arrayToCommaSeparatedString(v: unknown): string {
  return Array.isArray(v) ? (v as string[]).join(", ") : "";
}

function numberArrayToCommaSeparatedString(v: unknown): string {
  return Array.isArray(v) ? (v as number[]).join(", ") : "";
}

function setRuleLeafDefaults(
  setValue: UseFormReturn<FormValues>["setValue"],
  path: string,
  leafKind: LeafKind,
  preserveName: { attributeName: string } | { fieldName: string },
) {
  const base = { ...preserveName, filterKind: leafKind };
  switch (leafKind) {
    case "string":
      setValue(path, {
        ...base,
        allowlist: [],
        denylist: [],
        matchPrefixes: [],
        matchSuffixes: [],
      });
      break;
    case "numeric":
      setValue(path, { ...base, allowlist: [] });
      break;
    case "exists":
    case "notExists":
      setValue(path, { ...base });
      break;
  }
}

function LeafFilterFields({
  control,
  rulePath,
  filterKind,
}: {
  control: Control<FormValues>;
  rulePath: string;
  filterKind: LeafKind;
}) {
  if (filterKind === "exists" || filterKind === "notExists") {
    return (
      <p className="text-xs text-slate-500">
        No extra fields for this filter type.
      </p>
    );
  }

  if (filterKind === "string") {
    return (
      <div className="flex flex-col gap-2 border-l-2 border-slate-200 ps-2">
        <Controller
          name={`${rulePath}.allowlist` as "subscriptionFilter"}
          control={control}
          render={({ field }) => (
            <label className="flex flex-col gap-0.5 text-xs">
              <span className="text-slate-600">Allowlist (comma-separated)</span>
              <input
                className="rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                value={arrayToCommaSeparatedString(field.value)}
                onChange={(e) =>
                  field.onChange(commaSeparatedStringToArray(e.target.value))
                }
              />
            </label>
          )}
        />
        <Controller
          name={`${rulePath}.denylist` as "subscriptionFilter"}
          control={control}
          render={({ field }) => (
            <label className="flex flex-col gap-0.5 text-xs">
              <span className="text-slate-600">Denylist (comma-separated)</span>
              <input
                className="rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                value={arrayToCommaSeparatedString(field.value)}
                onChange={(e) =>
                  field.onChange(commaSeparatedStringToArray(e.target.value))
                }
              />
            </label>
          )}
        />
        <Controller
          name={`${rulePath}.matchPrefixes` as "subscriptionFilter"}
          control={control}
          render={({ field }) => (
            <label className="flex flex-col gap-0.5 text-xs">
              <span className="text-slate-600">Match prefixes (comma-separated)</span>
              <input
                className="rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                value={arrayToCommaSeparatedString(field.value)}
                onChange={(e) =>
                  field.onChange(commaSeparatedStringToArray(e.target.value))
                }
              />
            </label>
          )}
        />
        <Controller
          name={`${rulePath}.matchSuffixes` as "subscriptionFilter"}
          control={control}
          render={({ field }) => (
            <label className="flex flex-col gap-0.5 text-xs">
              <span className="text-slate-600">Match suffixes (comma-separated)</span>
              <input
                className="rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                value={arrayToCommaSeparatedString(field.value)}
                onChange={(e) =>
                  field.onChange(commaSeparatedStringToArray(e.target.value))
                }
              />
            </label>
          )}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-l-2 border-slate-200 ps-2">
      <Controller
        name={`${rulePath}.allowlist` as "subscriptionFilter"}
        control={control}
        render={({ field }) => (
          <label className="flex flex-col gap-0.5 text-xs">
            <span className="text-slate-600">Allowlist (comma-separated numbers)</span>
            <input
              className="rounded border border-slate-200 px-2 py-1 font-mono text-xs"
              value={numberArrayToCommaSeparatedString(field.value)}
              onChange={(e) =>
                field.onChange(commaSeparatedNumberToArray(e.target.value))
              }
            />
          </label>
        )}
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-slate-600">Greater than</span>
          <Controller
            name={`${rulePath}.greaterThan` as "subscriptionFilter"}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                className="rounded border border-slate-200 px-2 py-1 text-xs"
                value={field.value === undefined ? "" : String(field.value)}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : Number(v));
                }}
              />
            )}
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-slate-600">Greater or equal</span>
          <Controller
            name={`${rulePath}.greaterThanOrEqualTo` as "subscriptionFilter"}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                className="rounded border border-slate-200 px-2 py-1 text-xs"
                value={field.value === undefined ? "" : String(field.value)}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : Number(v));
                }}
              />
            )}
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-slate-600">Less than</span>
          <Controller
            name={`${rulePath}.lessThan` as "subscriptionFilter"}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                className="rounded border border-slate-200 px-2 py-1 text-xs"
                value={field.value === undefined ? "" : String(field.value)}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : Number(v));
                }}
              />
            )}
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-slate-600">Less or equal</span>
          <Controller
            name={`${rulePath}.lessThanOrEqualTo` as "subscriptionFilter"}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                className="rounded border border-slate-200 px-2 py-1 text-xs"
                value={field.value === undefined ? "" : String(field.value)}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : Number(v));
                }}
              />
            )}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-slate-600">Between start</span>
          <Controller
            name={`${rulePath}.between.start` as "subscriptionFilter"}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                className="rounded border border-slate-200 px-2 py-1 text-xs"
                value={field.value === undefined ? "" : String(field.value)}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : Number(v));
                }}
              />
            )}
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-slate-600">Between stop</span>
          <Controller
            name={`${rulePath}.between.stop` as "subscriptionFilter"}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                className="rounded border border-slate-200 px-2 py-1 text-xs"
                value={field.value === undefined ? "" : String(field.value)}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : Number(v));
                }}
              />
            )}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-slate-600">Strict between start</span>
          <Controller
            name={`${rulePath}.betweenStrict.start` as "subscriptionFilter"}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                className="rounded border border-slate-200 px-2 py-1 text-xs"
                value={field.value === undefined ? "" : String(field.value)}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : Number(v));
                }}
              />
            )}
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-slate-600">Strict between stop</span>
          <Controller
            name={`${rulePath}.betweenStrict.stop` as "subscriptionFilter"}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                className="rounded border border-slate-200 px-2 py-1 text-xs"
                value={field.value === undefined ? "" : String(field.value)}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : Number(v));
                }}
              />
            )}
          />
        </label>
      </div>
    </div>
  );
}

type NameField = "attributeName" | "fieldName";

type RuleRowErrors = {
  attributeName?: { message?: string };
  fieldName?: { message?: string };
  allowlist?: { message?: string };
};

function SnsSubscriptionRuleRow({
  formId,
  form,
  index,
  nameField,
  onRemove,
}: {
  formId: string;
  form: UseFormReturn<FormValues>;
  index: number;
  nameField: NameField;
  onRemove: () => void;
}) {
  const { control, register, setValue, getValues, formState: { errors } } = form;
  const rulePath = `subscriptionFilter.rules.${index}`;
  const filterKindRaw = useWatch({
    control,
    // Dynamic path under subscriptionFilter.rules.* (FormValues is a loose Record).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `${rulePath}.filterKind` as any,
    defaultValue: "exists",
  });
  const filterKind: LeafKind =
    filterKindRaw === "string" ||
    filterKindRaw === "numeric" ||
    filterKindRaw === "exists" ||
    filterKindRaw === "notExists"
      ? filterKindRaw
      : "exists";

  const errRoot = (
    errors.subscriptionFilter as { rules?: RuleRowErrors[] } | undefined
  )?.rules?.[index];

  const nameLabel =
    nameField === "attributeName" ? "Attribute name" : "JSON field name (top-level)";
  const namePlaceholder =
    nameField === "attributeName" ? "e.g. event_type" : "e.g. orderId";

  const nameRegister = register(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic field path
    `${rulePath}.${nameField}` as any,
  );

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/80 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600">
          Rule {index + 1}
        </span>
        <button
          type="button"
          className="text-xs text-red-600 hover:underline"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
      <label className="mb-2 flex flex-col gap-1 text-sm">
        <span className="text-slate-700">{nameLabel}</span>
        <input
          className={`rounded border px-2 py-1 text-sm ${
            errRoot?.[nameField] ? "border-red-300" : "border-slate-200"
          }`}
          placeholder={namePlaceholder}
          aria-invalid={errRoot?.[nameField] ? true : undefined}
          aria-describedby={
            errRoot?.[nameField]?.message
              ? fieldErrorId(formId, `${rulePath}.${nameField}`)
              : undefined
          }
          {...nameRegister}
        />
        <FieldError
          baseId={formId}
          field={`${rulePath}.${nameField}`}
          message={errRoot?.[nameField]?.message}
        />
      </label>
      <label className="mb-2 flex flex-col gap-1 text-sm">
        <span className="text-slate-700">Filter type</span>
        <select
          className="rounded border border-slate-200 px-2 py-1 text-sm"
          value={filterKind}
          onChange={(e) => {
            const next = e.target.value as LeafKind;
            const nm = String(getValues(`${rulePath}.${nameField}` as never) ?? "");
            const preserve =
              nameField === "attributeName"
                ? { attributeName: nm }
                : { fieldName: nm };
            setRuleLeafDefaults(setValue, rulePath, next, preserve);
          }}
        >
          <option value="string">String</option>
          <option value="numeric">Numeric</option>
          <option value="exists">Attribute / key exists</option>
          <option value="notExists">Attribute / key absent</option>
        </select>
      </label>
      <LeafFilterFields
        control={control}
        rulePath={rulePath}
        filterKind={filterKind}
      />
      <FieldError
        baseId={formId}
        field={`${rulePath}-leaf`}
        message={errRoot?.allowlist?.message}
      />
    </div>
  );
}

function AttributeOrBodyRules({
  formId,
  form,
  nameField,
}: {
  formId: string;
  form: UseFormReturn<FormValues>;
  nameField: NameField;
}) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray(
    {
      control,
      name: "subscriptionFilter.rules",
    } as never,
  );

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <SnsSubscriptionRuleRow
          key={field.id}
          formId={formId}
          form={form}
          index={index}
          nameField={nameField}
          onRemove={() => remove(index)}
        />
      ))}
      <button
        type="button"
        className="rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        onClick={() =>
          append(
            nameField === "attributeName"
              ? { attributeName: "", filterKind: "exists" }
              : { fieldName: "", filterKind: "exists" },
          )
        }
      >
        Add rule
      </button>
    </div>
  );
}

export function SnsLambdaSubscriptionEdgeFields({
  formId,
  form,
}: EdgeConfigFieldsProps) {
  const { control, setValue, formState: { errors } } = form;
  const subscriptionFilter = useWatch({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: "subscriptionFilter" as any,
    defaultValue: { kind: "none" },
  });
  const kind = (
    typeof subscriptionFilter === "object" &&
    subscriptionFilter !== null &&
    "kind" in subscriptionFilter
      ? subscriptionFilter.kind
      : "none"
  ) as SubscriptionFilterKind;

  const setKind = (next: SubscriptionFilterKind) => {
    const opts = { shouldDirty: true, shouldTouch: true };
    if (next === "none") {
      setValue("subscriptionFilter", { kind: "none" }, opts);
      return;
    }
    if (next === "messageAttributes") {
      setValue(
        "subscriptionFilter",
        {
          kind: "messageAttributes",
          rules: [{ attributeName: "", filterKind: "exists" }],
        },
        opts,
      );
      return;
    }
    setValue(
      "subscriptionFilter",
      {
        kind: "messageBody",
        rules: [{ fieldName: "", filterKind: "exists" }],
      },
      opts,
    );
  };

  const filterErr = errors.subscriptionFilter as { message?: string } | undefined;

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-slate-800">Subscription filter</span>
        <p className="text-xs text-slate-500">
          Message attributes and message body filters are mutually exclusive (same
          as SNS / CDK). Body mode uses top-level JSON keys only.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-slate-700">
          <input
            type="radio"
            name={`${formId}-sub-filter-kind`}
            checked={kind === "none"}
            onChange={() => setKind("none")}
          />
          Deliver all messages (no filter)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-slate-700">
          <input
            type="radio"
            name={`${formId}-sub-filter-kind`}
            checked={kind === "messageAttributes"}
            onChange={() => setKind("messageAttributes")}
          />
          Filter on message attributes
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-slate-700">
          <input
            type="radio"
            name={`${formId}-sub-filter-kind`}
            checked={kind === "messageBody"}
            onChange={() => setKind("messageBody")}
          />
          Filter on message body (top-level keys)
        </label>
      </div>

      {filterErr?.message ? (
        <p className="text-xs text-red-600" role="alert">
          {filterErr.message}
        </p>
      ) : null}

      {kind === "messageAttributes" ? (
        <AttributeOrBodyRules formId={formId} form={form} nameField="attributeName" />
      ) : null}
      {kind === "messageBody" ? (
        <AttributeOrBodyRules formId={formId} form={form} nameField="fieldName" />
      ) : null}
    </div>
  );
}
