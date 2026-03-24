import { fieldErrorId } from "./formFieldIds";

export function FieldError({
  baseId,
  field,
  message,
}: {
  baseId: string;
  field: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p
      id={fieldErrorId(baseId, field)}
      className="text-xs text-red-600"
      role="alert"
    >
      {message}
    </p>
  );
}
