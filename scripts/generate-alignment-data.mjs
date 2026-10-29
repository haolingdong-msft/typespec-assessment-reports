import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "alignment-data.json");
const categoryLabels = {
  aligned: "Aligned",
  expected: "Expected difference",
  unknown: "Cannot determine",
};
const evidenceStates = new Set(["breaking", "clear", "initial", "unverified"]);
const coverageValues = new Set(["complete", "partial", "blocked"]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readJson(fileName) {
  return JSON.parse(await readFile(path.join(root, fileName), "utf8"));
}

function indexUnique(items, label) {
  const index = new Map();
  for (const item of items) {
    assert(Number.isInteger(item.pr), `${label} contains an invalid PR number.`);
    assert(!index.has(item.pr), `${label} contains duplicate PR #${item.pr}.`);
    index.set(item.pr, item);
  }
  return index;
}

function assertMatchingPrSets(reference, candidate, candidateLabel) {
  const missing = [...reference.keys()].filter((pr) => !candidate.has(pr));
  const extra = [...candidate.keys()].filter((pr) => !reference.has(pr));
  assert(
    missing.length === 0 && extra.length === 0,
    `${candidateLabel} PR set differs from reports.json (missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}).`,
  );
}

function assertPinnedChangelogUrl(url, language, pr) {
  if (url === null) {
    return;
  }

  const expression = new RegExp(
    `^https://github\\.com/Azure/azure-sdk-for-${language}/blob/[0-9a-f]{40}/.+/CHANGELOG\\.md#L\\d+(?:-L\\d+)?$`,
  );
  assert(expression.test(url), `PR #${pr} ${language} changelog URL is not commit-pinned: ${url}`);
}

function buildEvidence(language, pr, curated, reportEvidence, detailedEvidence) {
  assert(curated && typeof curated === "object", `PR #${pr} is missing curated ${language} evidence.`);
  assert(evidenceStates.has(curated.state), `PR #${pr} has invalid ${language} evidence state ${curated.state}.`);
  assert(typeof curated.label === "string" && curated.label.length > 0, `PR #${pr} is missing a ${language} evidence label.`);
  assert(curated.url === null || typeof curated.url === "string", `PR #${pr} has an invalid ${language} evidence URL.`);
  assertPinnedChangelogUrl(curated.url, language, pr);

  if (reportEvidence.evidenceId) {
    assert(detailedEvidence, `PR #${pr} references missing evidence ${reportEvidence.evidenceId}.`);
    assert(detailedEvidence.pr === pr, `${reportEvidence.evidenceId} belongs to a different PR.`);
    assert(detailedEvidence.language === language, `${reportEvidence.evidenceId} belongs to a different language.`);
    assert(
      detailedEvidence.url === null || detailedEvidence.url === curated.url,
      `${reportEvidence.evidenceId} URL differs from reviewed curation.`,
    );
    assertPinnedChangelogUrl(detailedEvidence.url, language, pr);
  }

  return {
    state: curated.state,
    label: curated.label,
    url: curated.url,
    evidenceId: reportEvidence.evidenceId ?? null,
    status: detailedEvidence?.status ?? reportEvidence.status ?? "unverified",
    breakingChangesListed:
      detailedEvidence?.breakingChangesListed ?? reportEvidence.breakingChangesListed ?? null,
    association: detailedEvidence?.association ?? reportEvidence.association ?? "unverified",
    version: detailedEvidence?.version ?? reportEvidence.version ?? null,
    note: detailedEvidence?.note ?? reportEvidence.note ?? null,
    ...(detailedEvidence?.repo ? { repository: detailedEvidence.repo } : {}),
    ...(detailedEvidence?.packagePath ? { packagePath: detailedEvidence.packagePath } : {}),
    ...(detailedEvidence?.commit ? { commit: detailedEvidence.commit } : {}),
    ...(detailedEvidence?.sdkPrUrl ? { sdkPrUrl: detailedEvidence.sdkPrUrl } : {}),
  };
}

async function buildAlignmentData() {
  const [reports, manifest, evidence, curation] = await Promise.all([
    readJson("reports.json"),
    readJson("publication-manifest.json"),
    readJson("changelog-evidence.json"),
    readJson("alignment-curation.json"),
  ]);

  assert(Array.isArray(reports), "reports.json must contain an array.");
  assert(Array.isArray(manifest.entries), "publication-manifest.json must contain entries.");
  assert(Array.isArray(evidence.entries), "changelog-evidence.json must contain entries.");
  assert(Array.isArray(curation.reports), "alignment-curation.json must contain reports.");
  assert(manifest.reportCount === reports.length, "Publication manifest reportCount does not match reports.json.");
  assert(reports.length === 34, `Expected 34 retained reports, found ${reports.length}.`);
  assert(curation.reports.length === reports.length, "Curation count does not match reports.json.");

  const reportsByPr = indexUnique(reports, "reports.json");
  const manifestByPr = indexUnique(manifest.entries, "publication-manifest.json");
  const curationByPr = indexUnique(curation.reports, "alignment-curation.json");
  assertMatchingPrSets(reportsByPr, manifestByPr, "publication-manifest.json");
  assertMatchingPrSets(reportsByPr, curationByPr, "alignment-curation.json");

  const evidenceById = new Map();
  for (const entry of evidence.entries) {
    assert(typeof entry.id === "string" && entry.id.length > 0, "Changelog evidence contains an invalid ID.");
    assert(!evidenceById.has(entry.id), `Duplicate changelog evidence ID ${entry.id}.`);
    evidenceById.set(entry.id, entry);
  }

  const generatedReports = curation.reports.map((curated) => {
    const report = reportsByPr.get(curated.pr);
    const publication = manifestByPr.get(curated.pr);
    assert(categoryLabels[curated.category], `PR #${curated.pr} has invalid category ${curated.category}.`);
    assert(
      curated.categoryLabel === categoryLabels[curated.category],
      `PR #${curated.pr} category label does not match ${curated.category}.`,
    );
    assert(typeof curated.service === "string" && curated.service.length > 0, `PR #${curated.pr} is missing a service label.`);
    assert(typeof curated.outcome === "string" && curated.outcome.length > 0, `PR #${curated.pr} is missing an outcome.`);
    assert(typeof curated.reason === "string" && curated.reason.length > 0, `PR #${curated.pr} is missing a reason.`);
    assert(coverageValues.has(publication.coverage), `PR #${curated.pr} has invalid publication coverage ${publication.coverage}.`);

    const relatedPrs = curated.relatedPrs ?? [];
    const relatedNumbers = new Set();
    for (const related of relatedPrs) {
      assert(Number.isInteger(related.number), `PR #${curated.pr} has an invalid related PR number.`);
      assert(related.number !== curated.pr, `PR #${curated.pr} cannot relate to itself.`);
      assert(!relatedNumbers.has(related.number), `PR #${curated.pr} repeats related PR #${related.number}.`);
      assert(typeof related.label === "string" && related.label.length > 0, `PR #${curated.pr} has an unlabeled related PR.`);
      relatedNumbers.add(related.number);
    }

    const pythonReportEvidence = report.changelog?.python ?? {};
    const javaReportEvidence = report.changelog?.java ?? {};
    const pythonDetails = pythonReportEvidence.evidenceId
      ? evidenceById.get(pythonReportEvidence.evidenceId)
      : undefined;
    const javaDetails = javaReportEvidence.evidenceId
      ? evidenceById.get(javaReportEvidence.evidenceId)
      : undefined;

    return {
      pr: curated.pr,
      prUrl: report.prUrl,
      service: curated.service,
      category: curated.category,
      categoryLabel: curated.categoryLabel,
      outcome: curated.outcome,
      ...(curated.reasonCategory ? { reasonCategory: curated.reasonCategory } : {}),
      coverage: publication.coverage,
      verdict: publication.verdict,
      assessmentResult: publication.result,
      confidence: publication.confidence,
      findings: publication.findings,
      statuses: publication.statuses,
      blockers: publication.blockers,
      reportUrl: report.reportUrl,
      jsonUrl: report.jsonUrl,
      publicReportUrl: publication.publicReportUrl,
      publicJsonUrl: publication.publicJsonUrl,
      releasePlanId: report.releasePlanId,
      releasePlanUrl: report.releasePlanUrl,
      python: buildEvidence(
        "python",
        curated.pr,
        curated.sdkEvidence?.python,
        pythonReportEvidence,
        pythonDetails,
      ),
      java: buildEvidence(
        "java",
        curated.pr,
        curated.sdkEvidence?.java,
        javaReportEvidence,
        javaDetails,
      ),
      ...(relatedPrs.length > 0 ? { relatedPrs } : {}),
      reason: curated.reason,
    };
  });

  return {
    schemaVersion: 1,
    reportCount: generatedReports.length,
    sourceGeneratedAt: {
      reports: reports.reduce(
        (latest, report) => (!latest || report.generatedAt > latest ? report.generatedAt : latest),
        null,
      ),
      publicationManifest: manifest.generatedAt,
      changelogEvidence: evidence.generatedAt,
    },
    reports: generatedReports,
  };
}

async function main() {
  const check = process.argv.includes("--check");
  const unknownArguments = process.argv.slice(2).filter((argument) => argument !== "--check");
  assert(unknownArguments.length === 0, `Unknown argument: ${unknownArguments[0]}`);

  const generated = `${JSON.stringify(await buildAlignmentData(), null, 2)}\n`;
  if (check) {
    const committed = await readFile(outputPath, "utf8").catch(() => null);
    assert(committed !== null, "alignment-data.json is missing. Run the generator.");
    assert(committed === generated, "alignment-data.json is stale. Run the generator.");
    console.log("alignment-data.json is current and valid.");
    return;
  }

  await writeFile(outputPath, generated);
  console.log("Generated alignment-data.json.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
