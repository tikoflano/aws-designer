type MonacoNs = typeof import("monaco-editor");

let configured = false;

/**
 * Configures Monaco’s TypeScript/JavaScript language service once so inline Lambda
 * handlers get IntelliSense (the TS worker backs both `javascript` and `typescript` modes).
 */
export function setupLambdaMonaco(monaco: MonacoNs): void {
  if (configured) return;
  configured = true;

  const ts = monaco.languages.typescript;
  const { javascriptDefaults, typescriptDefaults } = ts;

  const compilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    allowJs: true,
    checkJs: false,
    skipLibCheck: true,
  };

  javascriptDefaults.setCompilerOptions(compilerOptions);
  typescriptDefaults.setCompilerOptions(compilerOptions);

  javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });
  typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  javascriptDefaults.setEagerModelSync(true);
  typescriptDefaults.setEagerModelSync(true);

  const mode = {
    completionItems: true,
    hovers: true,
    documentSymbols: true,
    definitions: true,
    references: true,
    documentHighlights: true,
    rename: true,
    diagnostics: true,
    documentRangeFormattingEdits: true,
    documentFormattingEdits: true,
    signatureHelp: true,
    onTypeFormattingEdits: true,
    codeActions: true,
    inlayHints: true,
  };
  javascriptDefaults.setModeConfiguration(mode);
  typescriptDefaults.setModeConfiguration(mode);

  // CommonJS-style handlers: `exports.handler = …`
  javascriptDefaults.addExtraLib(
    [
      "declare const exports: { handler?: unknown; [key: string]: unknown };",
      "declare const module: { exports: typeof exports };",
      "declare function require(id: string): unknown;",
    ].join("\n"),
    "file:///lambda/node-cjs-globals.d.ts",
  );
}
