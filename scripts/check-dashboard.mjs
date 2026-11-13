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

const [html, operationsHtml, combinedHtml, reportHtml, alignmentData, sourceReports] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "operations.html"), "utf8"),
  readFile(path.join(root, "combined.html"), "utf8"),
  Promise.all(reportPaths.map((reportPath) => readFile(reportPath, "utf8"))),
  readFile(path.join(root, "alignment-data.json"), "utf8").then(JSON.parse),
  readFile(path.join(root, "reports.json"), "utf8").then(JSON.parse),
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
const sourceReportsByPr = new Map(sourceReports.map((report) => [report.pr, report]));
const regenerationCounts = { observed: 0, "not-observed": 0, unverified: 0 };
let aggregatedSdkReleaseCount = 0;
for (const report of alignmentData.reports) {
  assert(categories[report.category] !== undefined, `PR #${report.pr} has an invalid category.`);
  assert(typeof report.verdict === "string", `PR #${report.pr} is missing a verdict.`);
  assert(typeof report.coverage === "string", `PR #${report.pr} is missing coverage.`);
  assert(typeof report.rootCauseCategory === "string", `PR #${report.pr} is missing a root cause category.`);
  assert(typeof report.rootCause === "string", `PR #${report.pr} is missing a root cause.`);
  assert(
    [true, false, null].includes(report.regenerationFlag) &&
      report.regenerationFlag === sourceReportsByPr.get(report.pr)?.regenerationFlag,
    `PR #${report.pr} has invalid or inconsistent regeneration data.`,
  );
  regenerationCounts[
    report.regenerationFlag === true ? "observed" : report.regenerationFlag === false ? "not-observed" : "unverified"
  ] += 1;
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
  JSON.stringify(regenerationCounts) === JSON.stringify({ observed: 20, "not-observed": 10, unverified: 4 }),
  `Unexpected regeneration totals: ${JSON.stringify(regenerationCounts)}.`,
);

const elements = new Map();
const context = vm.createContext({
  document: {
    querySelector(selector) {
      if (!elements.has(selector)) {
        elements.set(selector, {
          innerHTML: "",
          textContent: "",
          value: "",
          style: {},
          classList: { toggle() {}, remove() {} },
          addEventListener() {},
        });
      }
      return elements.get(selector);
    },
    querySelectorAll() { return []; },
  },
  window: { scrollTo() {} },
  console,
  fetch: async () => ({ ok: true, json: async () => alignmentData }),
});
await new vm.Script(scriptMatch[1], { filename: "index.html" }).runInContext(context);
for (const selector of ["#report-index", "#report-list"]) {
  const markup = elements.get(selector).innerHTML;
  for (const [state, count] of Object.entries(regenerationCounts)) {
    assert(
      markup.split(`class="regeneration-flag ${state}"`).length - 1 === count,
      `${selector} does not render ${count} ${state} regeneration flags.`,
    );
  }
}
for (const flag of [true, false, null]) {
  context.flag = flag;
  context.payload = {
    ...alignmentData,
    reportCount: 1,
    reports: [{ ...alignmentData.reports[0], regenerationFlag: flag }],
  };
  new vm.Script("validateAlignmentData(payload); regenerationBadge(flag);").runInContext(context);
}
for (const flag of [undefined, "false", "true", 0]) {
  context.flag = flag;
  context.payload.reports[0].regenerationFlag = flag;
  for (const expression of ["validateAlignmentData(payload)", "regenerationBadge(flag)"]) {
    let rejected = false;
    try {
      new vm.Script(expression).runInContext(context);
    } catch {
      rejected = true;
    }
    assert(rejected, `${expression} accepted invalid regeneration flag ${String(flag)}.`);
  }
}
assert(
  JSON.stringify(
    alignmentData.reports.reduce(
      (counts, report) => {
        counts[report.tcgcBreakingChange.state] += 1;
        return counts;
      },
      { breaking: 0, clear: 0, "not-assessed": 0 },
    ),
  ) === JSON.stringify({ breaking: 9, clear: 12, "not-assessed": 13 }),
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
