# TypeSpec Assessment Reports

Static GitHub Pages dashboard for 32 Azure REST API specification assessments: the original 30-case Python SDK regeneration experiment and two attribution-driven additions.

- 20 cases with observed Python SDK AutoPR regeneration
- 10 cases without observed regeneration in the October 8, 2026 snapshot
- Each dashboard row includes the PR merge date, release-plan association, SDK regeneration, assessed SDK breaking-change, GitHub SDK breaking-change labels, and final dimension outcomes
- The nine core reports include coordinator time and bounded Agent-input size; exact end-to-end and Agent-phase timings remain explicitly unavailable where they were not instrumented
- Each report includes rendered HTML and structured `assessment.json`

The attribution-driven additions are:

- [Azure/azure-rest-api-specs#44288](https://haolingdong-msft.github.io/typespec-assessment-reports/reports/pr-44288/), the earlier PR that introduced required `clusterName` on HorizonDB private endpoint update/delete.
- [Azure/azure-rest-api-specs#44101](https://haolingdong-msft.github.io/typespec-assessment-reports/reports/pr-44101/), the BulkActions core case used to isolate the C# UUID-mapping impact from the later publication PR.

Their release-plan and regeneration associations remain unverified and are displayed as such, not inherited from later PRs. They are outside the original sample and do not change the original 20/10 sampling split.

Machine-readable supporting artifacts:

- [Core and mandatory-verification performance](https://haolingdong-msft.github.io/typespec-assessment-reports/core-performance.json)
- [Nine-core publication manifest](https://haolingdong-msft.github.io/typespec-assessment-reports/publication-manifest.json)

The SDK breaking-change label flag is `Yes` when the PR has one or more language-specific `BreakingChange-*-Sdk` labels, including approved variants.

The SDK breaking-change flag is derived from the assessment downstream SDK result: `Yes` for failed findings, `No` for an assessed pass, and `Not assessed` when comparison was blocked.

The regeneration flag is based on the [Python Azure SDK AutoPR regeneration analysis snapshot](https://gist.github.com/msyyc/d3e190c9bc22c16ce540f1d925f95d57#file-regeneration-events-csv) through October 8, 2026.

Release-plan links use the mappings in the [30-case assessment sample](https://github.com/Azure/azure-sdk-tools/issues/17343#issuecomment-6310632825). Search by release-plan ID to find its assessment.
