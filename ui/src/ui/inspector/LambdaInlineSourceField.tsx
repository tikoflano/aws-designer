import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";

import {
  defaultInlineSourceForRuntime,
  LAMBDA_INLINE_SOURCE_MAX,
  type LambdaRuntime,
} from "@compiler/catalog.ts";
import { setupLambdaMonaco } from "../../monaco/setupLambdaMonaco";

type FormValues = Record<string, unknown>;

/** Monaco language id: JS uses the TS worker for IntelliSense; Python is syntax-only here. */
function monacoLanguageForRuntime(runtime: string): string {
  return runtime.startsWith("python") ? "python" : "javascript";
}

function monacoModelPathForLanguage(monacoLang: string): string {
  return monacoLang === "python"
    ? "file:///lambda/lambda_function.py"
    : "file:///lambda/index.js";
}

function languageDisplayName(monacoLang: string): string {
  return monacoLang === "python" ? "Python" : "JavaScript";
}

const suggestOptions = {
  quickSuggestions: { other: true, comments: false, strings: true },
  suggestOnTriggerCharacters: true,
  tabCompletion: "on" as const,
  wordBasedSuggestions: "currentDocument" as const,
};

const editorOptionsInline = {
  ...suggestOptions,
  minimap: { enabled: false },
  wordWrap: "on" as const,
  scrollBeyondLastLine: false,
  fontSize: 13,
  tabSize: 2,
  automaticLayout: true,
};

const editorOptionsExpanded = {
  ...suggestOptions,
  minimap: { enabled: true },
  wordWrap: "on" as const,
  scrollBeyondLastLine: false,
  fontSize: 14,
  tabSize: 2,
  automaticLayout: true,
  lineNumbers: "on" as const,
  renderLineHighlight: "all" as const,
};

function LambdaCodeExpandedModal({
  open,
  onClose,
  onFormat,
  onEditorMount,
  field,
  language,
  languageDisplay,
  modelPath,
  runtimeLabel,
  titleId,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onFormat: () => void;
  onEditorMount: (ed: editor.IStandaloneCodeEditor) => void;
  field: ControllerRenderProps<FormValues, "codeSource.inlineSource">;
  language: string;
  languageDisplay: string;
  modelPath: string;
  runtimeLabel: string;
  titleId: string;
  message?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-sm md:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex h-[min(92vh,56rem)] w-full max-w-[min(100%,96rem)] flex-col overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] shadow-2xl ring-1 ring-black/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex h-11 shrink-0 items-center gap-3 border-b border-[#252526] bg-[#323233] px-3 text-[#cccccc]">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-sm font-medium text-[#e0e0e0]">
              Function code
            </h2>
            <p className="truncate text-xs text-[#9d9d9d] tabular-nums">
              {runtimeLabel} · {languageDisplay}
              {language === "python" ? " · limited IntelliSense" : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onFormat}
              title="Format document (JavaScript/TypeScript engine; Node runtimes only)"
              className="shrink-0 rounded px-3 py-1.5 text-xs font-medium text-[#cccccc] hover:bg-[#3c3c3c] hover:text-white"
            >
              Format
            </button>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded px-3 py-1.5 text-xs font-medium text-[#cccccc] hover:bg-[#3c3c3c] hover:text-white"
            >
              Done
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <Editor
            height="100%"
            path={modelPath}
            language={language}
            theme="vs-dark"
            value={typeof field.value === "string" ? field.value : ""}
            onChange={(v) => field.onChange(v ?? "")}
            beforeMount={setupLambdaMonaco}
            onMount={onEditorMount}
            options={editorOptionsExpanded}
            aria-describedby={message ? `${titleId}-err` : undefined}
          />
        </div>
        {message ? (
          <p
            id={`${titleId}-err`}
            className="shrink-0 border-t border-[#252526] bg-[#2d2d2d] px-3 py-2 text-xs text-red-400"
            role="alert"
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function LambdaInlineSourceField({
  control,
  getValues,
  setValue,
  errors,
  formId,
}: {
  control: Control<FormValues>;
  getValues: UseFormGetValues<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  errors: FieldErrors<FormValues>;
  formId: string;
}) {
  const [expandedOpen, setExpandedOpen] = useState(false);
  const expandedTitleId = useId();

  const runtime = useWatch({ control, name: "runtime" }) as string | undefined;
  const prevRuntimeRef = useRef<LambdaRuntime | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount = useCallback((ed: editor.IStandaloneCodeEditor) => {
    editorRef.current = ed;
  }, []);

  const formatCode = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const action = ed.getAction("editor.action.formatDocument");
    if (!action?.isSupported?.()) return;
    void action
      .run()
      .then(() => {
        (setValue as (n: string, v: string, o?: object) => void)(
          "codeSource.inlineSource",
          ed.getValue(),
          { shouldDirty: true, shouldValidate: true },
        );
      })
      .catch(() => {
        /* no formatter for this language */
      });
  }, [setValue]);

  useEffect(() => {
    if (runtime === undefined) return;
    const prev = prevRuntimeRef.current;
    prevRuntimeRef.current = runtime as LambdaRuntime;
    if (prev === null) return;
    if (prev === runtime) return;

    const cs = getValues("codeSource") as { type?: string; inlineSource?: string } | undefined;
    if (cs?.type !== "inline") return;
    const current = String(cs.inlineSource ?? "");
    if (current === defaultInlineSourceForRuntime(prev)) {
      setValue(
        "codeSource",
        {
          type: "inline",
          inlineSource: defaultInlineSourceForRuntime(runtime as LambdaRuntime),
        },
        { shouldDirty: true, shouldValidate: true },
      );
    }
  }, [runtime, getValues, setValue]);

  const errRecord = errors as Record<string, { message?: string } | undefined>;
  const errDot = errRecord["codeSource.inlineSource"];
  const nested = (
    errors.codeSource as { inlineSource?: { message?: string } } | undefined
  )?.inlineSource;
  const message =
    typeof errDot?.message === "string"
      ? errDot.message
      : typeof nested?.message === "string"
        ? nested.message
        : undefined;

  const lang =
    runtime !== undefined
      ? monacoLanguageForRuntime(runtime)
      : "javascript";

  const modelPath = monacoModelPathForLanguage(lang);
  const langDisplay = languageDisplayName(lang);

  const runtimeLabel = runtime ?? "—";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-slate-700">Function code</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={formatCode}
            title="Format document (JavaScript/TypeScript engine; Node runtimes only)"
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Format
          </button>
          <button
            type="button"
            onClick={() => setExpandedOpen(true)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Expand editor
          </button>
        </div>
      </div>
      <span className="text-xs text-slate-500">
        Inline only (max {LAMBDA_INLINE_SOURCE_MAX} characters for CloudFormation).
        {lang === "javascript"
          ? " Node runtimes: autocomplete and hovers use the in-browser TypeScript service."
          : " Python: syntax highlighting only (no full language service)."}
      </span>
      <Controller
        name="codeSource.inlineSource"
        control={control}
        render={({ field }) => (
          <>
            {!expandedOpen ? (
              <div
                className={`min-h-[240px] overflow-hidden rounded border ${
                  message ? "border-red-300" : "border-slate-200"
                }`}
              >
                <Editor
                  height="min(40vh, 280px)"
                  path={modelPath}
                  language={lang}
                  theme="vs"
                  value={typeof field.value === "string" ? field.value : ""}
                  onChange={(v) => field.onChange(v ?? "")}
                  beforeMount={setupLambdaMonaco}
                  onMount={handleEditorMount}
                  options={editorOptionsInline}
                  aria-describedby={
                    message ? `${formId}-codeSource-inlineSource-err` : undefined
                  }
                />
              </div>
            ) : (
              <div className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm text-slate-600">
                  Code is open in the expanded editor.
                </p>
                <button
                  type="button"
                  onClick={() => setExpandedOpen(false)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
                >
                  Return to inline editor
                </button>
              </div>
            )}
            <LambdaCodeExpandedModal
              open={expandedOpen}
              onClose={() => setExpandedOpen(false)}
              onFormat={formatCode}
              onEditorMount={handleEditorMount}
              field={field}
              language={lang}
              languageDisplay={langDisplay}
              modelPath={modelPath}
              runtimeLabel={runtimeLabel}
              titleId={expandedTitleId}
              message={message}
            />
          </>
        )}
      />
      {message && !expandedOpen ? (
        <p
          id={`${formId}-codeSource-inlineSource-err`}
          className="text-xs text-red-600"
          role="alert"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
