# TypeSpec Assessment Reports

Static GitHub Pages dashboard for 31 Azure REST API specification assessments: the original 30-case Python SDK regeneration experiment and one attribution-driven addition.

- 20 cases with observed Python SDK AutoPR regeneration
- 10 cases without observed regeneration in the October 8, 2026 snapshot
- Each dashboard row includes the PR merge date, a release-plan link, and explicit SDK regeneration, assessed SDK breaking-change, and GitHub SDK breaking-change label flags
- Each report includes rendered HTML and structured `assessment.json`

The additional [assessment for Azure/azure-rest-api-specs#44288](https://haolingdong-msft.github.io/typespec-assessment-reports/reports/pr-44288/) investigates the earlier PR that introduced required `clusterName` on HorizonDB private endpoint update/delete. Its release-plan and regeneration associations remain unverified and are displayed as such, not copied from the later PR's SDK release. It is outside the original sample and does not change the original 20/10 sampling split.

The SDK breaking-change label flag is `Yes` when the PR has one or more language-specific `BreakingChange-*-Sdk` labels, including approved variants.

The SDK breaking-change flag is derived from the assessment downstream SDK result: `Yes` for failed findings, `No` for an assessed pass, and `Not assessed` when comparison was blocked.

The regeneration flag is based on the [Python Azure SDK AutoPR regeneration analysis snapshot](https://gist.github.com/msyyc/d3e190c9bc22c16ce540f1d925f95d57#file-regeneration-events-csv) through October 8, 2026.

Release-plan links use the mappings in the [30-case assessment sample](https://github.com/Azure/azure-sdk-tools/issues/17343#issuecomment-6310632825). Search by release-plan ID to find its assessment.

The site is generated from assessment reports stored under `C:\workspace\documents`.
