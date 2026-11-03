import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const [html, alignmentData] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "alignment-data.json"), "utf8").then(JSON.parse),
]);

assert(html.includes('fetch("alignment-data.json"'), "Dashboard does not load alignment-data.json.");
assert(html.includes("payload?.schemaVersion !== 2"), "Dashboard does not accept alignment data schema 2.");
assert(!html.includes("const reports = ["), "Dashboard still embeds the alignment report array.");
assert(!html.includes("const assessmentStates ="), "Dashboard still embeds assessment states.");
assert(!html.includes("const freshFindings ="), "Dashboard still embeds fresh finding counts.");

for (const id of [
  "report-total",
  "aligned-count",
  "expected-count",
  "unknown-count",
  "all-filter",
  "all-sdk-releases-filter",
  "aggregated-sdk-releases-filter",
  "unattributed-sdk-releases-filter",
  "load-error",
]) {
  assert(html.includes(`id="${id}"`), `Dashboard is missing #${id}.`);
}

const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/);
assert(scriptMatch, "Dashboard script was not found.");
new vm.Script(scriptMatch[1], { filename: "index.html" });

assert(alignmentData.schemaVersion === 2, "Unsupported alignment data schema.");
assert(alignmentData.reportCount === alignmentData.reports.length, "Alignment report count is inconsistent.");
assert(alignmentData.reportCount === 34, `Expected 34 reports, found ${alignmentData.reportCount}.`);

const categories = { aligned: 0, expected: 0, unknown: 0 };
let aggregatedSdkReleaseCount = 0;
for (const report of alignmentData.reports) {
  assert(categories[report.category] !== undefined, `PR #${report.pr} has an invalid category.`);
  assert(typeof report.verdict === "string", `PR #${report.pr} is missing a verdict.`);
  assert(typeof report.coverage === "string", `PR #${report.pr} is missing coverage.`);
  assert(typeof report.rootCauseCategory === "string", `PR #${report.pr} is missing a root cause category.`);
  assert(typeof report.rootCause === "string", `PR #${report.pr} is missing a root cause.`);
  assert(
    typeof report.sdkReleaseIncludesOtherSpecPrs === "boolean",
    `PR #${report.pr} is missing the SDK release aggregation flag.`,
  );
  assert(
    report.sdkReleaseIncludesOtherSpecPrs === Boolean(report.relatedPrs?.length),
    `PR #${report.pr} has inconsistent SDK release aggregation data.`,
  );
  assert(report.findings && report.python && report.java, `PR #${report.pr} is missing dashboard data.`);
  categories[report.category] += 1;
  aggregatedSdkReleaseCount += Number(report.sdkReleaseIncludesOtherSpecPrs);
}

assert(
  categories.aligned === 11 && categories.expected === 14 && categories.unknown === 9,
  `Unexpected category totals: ${JSON.stringify(categories)}.`,
);
assert(aggregatedSdkReleaseCount === 9, `Expected 9 aggregated SDK releases, found ${aggregatedSdkReleaseCount}.`);

console.log("Dashboard data contract is valid.");
