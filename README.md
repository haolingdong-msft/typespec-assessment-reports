# TypeSpec Assessment Reports

The [main dashboard](https://haolingdong-msft.github.io/typespec-assessment-reports/)
lists all **34 fresh PR reassessments** and preserves the earlier pinned
Python/Java downstream-alignment analysis as a separate view.

- **26** PRs produced guarded, finalized assessment reports.
- **8** PRs were blocked before a final report could be
  produced; their dashboard pages show the exact blocker and preserve the
  previous report as historical evidence.
- Fresh reassessment findings: **97** across REST, downstream SDK,
  Azure Guidelines, and Documentation Completeness.

The report index uses the fresh October 29, 2026 results. The downstream
alignment categories remain the earlier pinned comparison and are labeled as
such; they were not automatically reclassified from the fresh finding counts.

Machine-readable artifacts:

- [Generated SDK alignment data](https://haolingdong-msft.github.io/typespec-assessment-reports/alignment-data.json)
- [Reviewed SDK alignment curation](https://haolingdong-msft.github.io/typespec-assessment-reports/alignment-curation.json)
- [Fresh dashboard rows](https://haolingdong-msft.github.io/typespec-assessment-reports/reports.json)
- [Fresh publication manifest](https://haolingdong-msft.github.io/typespec-assessment-reports/publication-manifest.json)
- [Previous dashboard rows](https://haolingdong-msft.github.io/typespec-assessment-reports/legacy-reports.json)
- [Pinned Python/Java changelog evidence](https://haolingdong-msft.github.io/typespec-assessment-reports/changelog-evidence.json)

`alignment-curation.json` contains the reviewed classification, explanation,
related spec PR attribution, and SDK evidence association for each retained
report. Generate the dashboard-ready artifact after updating its inputs:

```shell
node scripts/generate-alignment-data.mjs
```

Verify that the committed artifact is valid and current:

```shell
node scripts/generate-alignment-data.mjs --check
```

The main dashboard loads `alignment-data.json` at runtime, so publish the
generated artifact and `index.html` together. Validate their data contract and
the dashboard's inline JavaScript before publishing:

```shell
node scripts/check-dashboard.mjs
```

The full structured result for PR #44988 is published as
`assessment.json.gz` because the uncompressed report exceeds GitHub's
per-file size limit.

The overall safety verdict covers REST and downstream SDK compatibility only.
Azure Guidelines and Documentation Completeness remain independently reported.
A blocked result is never presented as a compatibility pass.
