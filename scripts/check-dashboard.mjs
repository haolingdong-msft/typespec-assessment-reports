import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const reportsRoot = path.join(root, "reports");
const reportDirectories = await readdir(reportsRoot, { withFileTypes: true });
const reportPaths = reportDirectories
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(reportsRoot, entry.name, "index.html"));

const [html, operationsHtml, combinedHtml, reportHtml, alignmentData] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "operations.html"), "utf8"),
  readFile(path.join(root, "combined.html"), "utf8"),
  Promise.all(reportPaths.map((reportPath) => readFile(reportPath, "utf8"))),
  readFile(path.join(root, "alignment-data.json"), "utf8").then(JSON.parse),
]);

assert(html.includes('fetch("alignment-data.json"'), "Dashboard does not load alignment-data.json.");
assert(html.includes("payload?.schemaVersion !== 2"), "Dashboard does not accept alignment data schema 2.");
assert(!html.includes("const reports = ["), "Dashboard still embeds the alignment report array.");
assert(!html.includes("const assessmentStates ="), "Dashboard still embeds assessment states.");
assert(!html.includes("const freshFindings ="), "Dashboard still embeds fresh finding counts.");

const coverageLabels = [
  "partial coverage",
  "complete coverage",
  "coverage blocked",
  "blocked coverage",
];
const renderedHtml = [html, operationsHtml, combinedHtml, ...reportHtml];
for (const label of coverageLabels) {
  assert(
    renderedHtml.every((document) => !document.toLowerCase().includes(label)),
    `Static site still renders "${label}".`,
  );
}
assert(!html.includes("Assessment coverage"), "Dashboard still renders assessment coverage.");
assert(!html.includes("report.coverage"), "Dashboard still renders report coverage.");
assert(!operationsHtml.includes("function coverage("), "Operations dashboard still renders coverage.");

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
    typeof report.sdkReleaseIncludesSameApiVersionSpecPrs === "boolean",
    `PR #${report.pr} is missing the same-version SDK release aggregation flag.`,
  );
  assert(
    report.sdkReleaseIncludesSameApiVersionSpecPrs === Boolean(report.sameApiVersionRelatedPrs?.length),
    `PR #${report.pr} has inconsistent same-version SDK release aggregation data.`,
  );
  assert(
    ["breaking", "clear", "not-assessed"].includes(report.tcgcBreakingChange?.state),
    `PR #${report.pr} has an invalid TCGC breaking-change state.`,
  );
  assert(
    typeof report.tcgcBreakingChange.label === "string" &&
      Number.isInteger(report.tcgcBreakingChange.findingCount) &&
      report.tcgcBreakingChange.findingCount === report.findings.sdk,
    `PR #${report.pr} has inconsistent TCGC breaking-change data.`,
  );
  for (const related of report.sameApiVersionRelatedPrs ?? []) {
    assert(typeof related.apiVersion === "string" && related.apiVersion.length > 0, `PR #${report.pr} has a same-version relation without an API version.`);
    assert(
      report.relatedPrs?.some((candidate) => candidate.number === related.number),
      `PR #${report.pr} same-version relation #${related.number} is missing from related PR context.`,
    );
  }
  assert(report.findings && report.python && report.java, `PR #${report.pr} is missing dashboard data.`);
  categories[report.category] += 1;
  aggregatedSdkReleaseCount += Number(report.sdkReleaseIncludesSameApiVersionSpecPrs);
}

assert(
  categories.aligned === 12 && categories.expected === 18 && categories.unknown === 4,
  `Unexpected category totals: ${JSON.stringify(categories)}.`,
);
assert(aggregatedSdkReleaseCount === 6, `Expected 6 same-version aggregated SDK releases, found ${aggregatedSdkReleaseCount}.`);
assert(
  JSON.stringify(
    alignmentData.reports.reduce(
      (counts, report) => {
        counts[report.tcgcBreakingChange.state] += 1;
        return counts;
      },
      { breaking: 0, clear: 0, "not-assessed": 0 },
    ),
  ) === JSON.stringify({ breaking: 9, clear: 13, "not-assessed": 12 }),
  "Unexpected TCGC breaking-change totals.",
);
assert(
  JSON.stringify(
    alignmentData.reports
      .filter((report) => report.sdkReleaseIncludesSameApiVersionSpecPrs)
      .map((report) => report.pr)
      .sort((left, right) => left - right),
  ) === JSON.stringify([44524, 44988, 45167, 46008, 46075, 46679]),
  "Unexpected same-version SDK aggregation PR set.",
);

console.log("Dashboard data contract is valid.");
