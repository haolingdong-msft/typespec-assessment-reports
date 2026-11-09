# TypeSpec Assessment Reports

The [main dashboard](https://haolingdong-msft.github.io/typespec-assessment-reports/)
lists all **34 fresh PR reassessments** and preserves the earlier pinned
Python/Java downstream-alignment analysis as a separate view.

- **28** PRs produced guarded, finalized assessment reports.
- **6** PRs remain blocked before guarded finalization because their historical baseline project cannot produce required compiler or contract artifacts.
- **10** Passed, **9** Failed, and **15** Unknown.
- Fresh reassessment findings: **107** total (43 REST, 33 downstream SDK, 6 Azure Guidelines, and 25 Documentation Completeness).

The report index uses the retained structured reassessments plus the November 6 AI source-review refreshes for PRs #43918, #44288, #44988, and #46679. PR #45678 retains its validated report because its historical structured finding uses an unsupported semantic match basis in the latest renderer. The downstream
alignment categories remain the earlier pinned comparison and are labeled as
such; they were not automatically reclassified from the fresh finding counts.

Machine-readable artifacts:

- [Generated SDK alignment data](https://haolingdong-msft.github.io/typespec-assessment-reports/alignment-data.json)
- [Reviewed SDK alignment curation](https://haolingdong-msft.github.io/typespec-assessment-reports/alignment-curation.json)
- [Fresh dashboard rows](https://haolingdong-msft.github.io/typespec-assessment-reports/reports.json)
- [Fresh publication manifest](https://haolingdong-msft.github.io/typespec-assessment-reports/publication-manifest.json)
- [Previous dashboard rows](https://haolingdong-msft.github.io/typespec-assessment-reports/legacy-reports.json)
- [Pinned Python/Java changelog evidence](https://haolingdong-msft.github.io/typespec-assessment-reports/changelog-evidence.json)

`alignment-curation.json` contains the reviewed classification, explicit root
cause category and explanation, related spec PR attribution, and SDK evidence
association for each retained report. Root cause distinguishes spec-authored
contract changes from TypeSpec migrations, language-specific SDK
surfaces, aggregated releases, unavailable mappings, and blocked assessments.
The generated `sdkReleaseIncludesSameApiVersionSpecPrs` flag identifies mapped
SDK releases with attributed changes from other spec PRs that update the same
API version as the assessed PR. Each qualifying relation records the exact
`apiVersion`; different-version changes, SDK-only configuration, and later
compatibility mitigation remain related context but do not enter this filter.
The Downstream analysis page exposes the flag as an independent SDK release
scope filter across all alignment categories.
Each analysis card also states whether the neutral TCGC downstream assessment
detected a breaking change, detected no breaking change, or was not assessed.
For a release with SDK breaking changes but no TCGC candidate, classify an
explicit TypeSpec migration first. If migration is excluded, attribute the
difference to an aggregated SDK release when the breaking item is traced to
another spec PR; use a language-specific category only when the current PR has
direct evidence of causing that generated-language surface change.
Generate the dashboard-ready artifact after updating its inputs:

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

## November 9 two-stage reports

These are the existing two-stage runs, not reruns against the later stacked
preview-only policy. They are published separately so the dashboards and
historical reports retain their existing data and navigation.

| Azure/azure-rest-api-specs PR | HTML report | Structured result | REST / SDK findings |
| --- | --- | --- | --- |
| 46679 | [Report](reports/pr-46679-two-stage-2026-11-09/) | [JSON](reports/pr-46679-two-stage-2026-11-09/assessment.json) | 4 / 10 |
| 44988 | [Report](reports/pr-44988-two-stage-2026-11-09/) | [JSON (gzip)](reports/pr-44988-two-stage-2026-11-09/assessment.json.gz) | 6 / 3 |
| 44288 | [Report](reports/pr-44288-two-stage-2026-11-09/) | [JSON](reports/pr-44288-two-stage-2026-11-09/assessment.json) | 4 / 4 |
| 43918 | [Report](reports/pr-43918-two-stage-2026-11-09/) | [JSON](reports/pr-43918-two-stage-2026-11-09/assessment.json) | 0 / 0 |

PR 43918 remains **unknown/blocked**, with source AI skipped; zero findings do
not mean compatibility passed. PR 46679 includes the repaired REST
`CloudAccountProperties` owner, complete model source with `@removed`, and
reciprocal affected-intent links.

[Publication metadata](two-stage-publication-manifest.json) records source and
published hashes, run identities, verdicts, and sanitization. HTML reports are
published unchanged. JSON downloads replace local workspace/artifact path
prefixes with placeholders; assessment content and canonical public code links
are preserved. The PR 44988 JSON download is gzip-compressed to stay below
GitHub's per-file size limit.
