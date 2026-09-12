#!/usr/bin/env node
/**
 * Flags user-facing strings that bypass i18n. Run: `node scripts/check-i18n.js`
 *
 * Reports (file:line):
 *   - JSX text containing letters
 *   - string literals in user-facing JSX props (title, label, placeholder, …)
 *   - string literals / templates passed to Alert.alert
 *
 * Suppress a deliberate literal (brand names, debug tools, developer-facing
 * text) with `i18n-ignore-next-line`, or wrap a block in
 * `i18n-ignore-start` … `i18n-ignore-end` comments.
 *
 * Missing/extra translation keys are caught by `tsc` instead (locales are
 * typed against locales/en.ts).
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const DIRS = ["app", "components", "hooks", "lib"];
const SKIP_FILES = new Set([
  "lib/dev-seed.ts", // debug-only demo data
  "app/modal.tsx", // unused Expo template screen
  "components/EditScreenInfo.tsx", // Expo template
]);
const USER_FACING_PROPS = new Set([
  "title",
  "label",
  "placeholder",
  "message",
  "subtitle",
  "description",
  "accessibilityLabel",
  "accessibilityHint",
  "actionLabel",
  "headerTitle",
  "headerBackTitle",
  "emptyText",
]);
const HAS_LETTER = /\p{L}/u;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function ignoredLines(text) {
  const lines = text.split("\n");
  const ignored = new Set();
  let inBlock = false;
  lines.forEach((line, i) => {
    if (line.includes("i18n-ignore-start")) inBlock = true;
    if (inBlock) ignored.add(i + 1);
    if (line.includes("i18n-ignore-end")) inBlock = false;
    if (line.includes("i18n-ignore-next-line")) ignored.add(i + 2);
  });
  return ignored;
}

const findings = [];

for (const file of DIRS.flatMap((d) => walk(path.join(ROOT, d), []))) {
  const rel = path.relative(ROOT, file);
  if (SKIP_FILES.has(rel)) continue;
  const text = fs.readFileSync(file, "utf8");
  const ignored = ignoredLines(text);
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  const report = (node, what) => {
    const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    if (ignored.has(line)) return;
    findings.push(`${rel}:${line}  ${what}`);
  };
  const literalText = (node) =>
    ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
      ? node.text
      : ts.isTemplateExpression(node)
        ? node.head.text + node.templateSpans.map((s) => s.literal.text).join("…")
        : null;

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const value = node.text.replace(/\s+/g, " ").trim();
      if (value && HAS_LETTER.test(value)) report(node, `JSX text: "${value}"`);
    } else if (ts.isJsxAttribute(node) && node.initializer) {
      const name = node.name.getText(source);
      if (USER_FACING_PROPS.has(name)) {
        let init = node.initializer;
        if (ts.isJsxExpression(init) && init.expression) init = init.expression;
        const value = literalText(init);
        if (value && HAS_LETTER.test(value)) report(node, `${name}="${value}"`);
      }
    } else if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === "Alert.alert"
    ) {
      for (const arg of node.arguments.slice(0, 2)) {
        const value = literalText(arg);
        if (value && HAS_LETTER.test(value)) report(arg, `Alert.alert("${value}")`);
      }
    } else if (
      ts.isPropertyAssignment(node) &&
      ["text", "title", "body", "subtitle", "label", "helper", "eyebrow", "description", "message", "placeholder", "hint"].includes(node.name.getText(source))
    ) {
      const value = literalText(node.initializer);
      if (value && HAS_LETTER.test(value) && /\s|[A-Z]/.test(value)) {
        report(node, `${node.name.getText(source)}: "${value}"`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

if (findings.length > 0) {
  console.log(findings.join("\n"));
  console.log(`\n${findings.length} hard-coded user-facing string(s). Move them to locales/en.ts or mark with i18n-ignore-next-line.`);
  process.exit(1);
}
console.log("check-i18n: no hard-coded user-facing strings found.");
