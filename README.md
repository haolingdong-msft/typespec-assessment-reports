# TypeSpec Assessment Reports

The [main dashboard](https://haolingdong-msft.github.io/typespec-assessment-reports/) and [combined view](https://haolingdong-msft.github.io/typespec-assessment-reports/combined.html) highlight **nine core assessments**: Azure/azure-rest-api-specs#44288, Azure/azure-rest-api-specs#44920, Azure/azure-rest-api-specs#44101, Azure/azure-rest-api-specs#44557, Azure/azure-rest-api-specs#46008, Azure/azure-rest-api-specs#43918, Azure/azure-rest-api-specs#43757, Azure/azure-rest-api-specs#39064, and Azure/azure-rest-api-specs#46679.

The other **25 assessments are archived**, not deleted. Use the [archive dashboard](https://haolingdong-msft.github.io/typespec-assessment-reports/archive.html) to search them. Every existing individual HTML/JSON report URL remains unchanged.

The complete retained collection contains 34 assessments: the original 30-case Python SDK regeneration experiment, two attribution-driven additions, and two mandatory optimization-verification reports.

- 20 cases with observed Python SDK AutoPR regeneration
- 10 cases without observed regeneration in the October 8, 2026 snapshot
- Each dashboard row includes the PR merge date, release-plan association, SDK regeneration, assessed SDK breaking-change, separate Python/Java changelog results and release-entry links, final dimension outcomes, coordinator time, and bounded Agent-input size when recorded
- Each report includes rendered HTML and structured `assessment.json`
- The 11 refreshed cases use hash-verified frozen preparation/compiler artifacts, fresh bounded judgment, and guarded finalization. Replay wall time includes actual waits and is not fresh-compilation E2E; historical timing evidence is retained separately

The attribution-driven additions are:

- [Azure/azure-rest-api-specs#44288](https://haolingdong-msft.github.io/typespec-assessment-reports/reports/pr-44288/), the earlier PR that introduced required `clusterName` on HorizonDB private endpoint update/delete.
- [Azure/azure-rest-api-specs#44101](https://haolingdong-msft.github.io/typespec-assessment-reports/reports/pr-44101/), the BulkActions core case used to isolate the C# UUID-mapping impact from the later publication PR.

The additional mandatory verification reports are now in the archive:

- [Azure/azure-rest-api-specs#44988](https://haolingdong-msft.github.io/typespec-assessment-reports/reports/pr-44988/), the operation-heavy Network API-version publication and carry-over compaction case.
- [Azure/azure-rest-api-specs#45348](https://haolingdong-msft.github.io/typespec-assessment-reports/reports/pr-45348/), the common-types propagation case retaining all 237 REST candidate identities.

These additions are outside the original sample and do not change its 20/10 sampling split. Release-plan and regeneration associations remain unverified where shown and are not inherited from other PRs.

The [combined view of the nine core reports](https://haolingdong-msft.github.io/typespec-assessment-reports/combined.html) has top PR anchor navigation and continuously displays every complete report. The [two archived verification reports have a separate combined view](https://haolingdong-msft.github.io/typespec-assessment-reports/combined-archive.html). Existing combined-page anchors for those two PRs redirect there. Each section retains its individual HTML/JSON links. Unresolved contract evidence is explicitly not assessed rather than counted as compatible.

Machine-readable supporting artifacts:

- [Nine active dashboard rows](https://haolingdong-msft.github.io/typespec-assessment-reports/reports.json)
- [25 archived dashboard rows](https://haolingdong-msft.github.io/typespec-assessment-reports/archive-reports.json)
- [Pinned Python/Java changelog evidence](https://haolingdong-msft.github.io/typespec-assessment-reports/changelog-evidence.json)
- [Before/after semantic intents, findings, and fresh decision rationales](https://haolingdong-msft.github.io/typespec-assessment-reports/refresh-comparison.json)

- [Core and mandatory-verification performance](https://haolingdong-msft.github.io/typespec-assessment-reports/core-performance.json)
- [Core and verification-report publication manifest](https://haolingdong-msft.github.io/typespec-assessment-reports/publication-manifest.json)

The Python and Java changelog columns show whether the linked, commit-pinned SDK release entry lists **Breaking Changes**, independently of the assessment result. `Yes` means listed, `No` means none listed, `Initial release` means there is no previous package to compare, and `Unverified` means the dashboard has no verified changelog association for that case. No changelog entry is not evidence of compatibility.

Reference-only SDK associations are marked explicitly rather than presented as isolated releases of the spec PR. Closed, unmerged SDK PRs are not shipped-release evidence. Cumulative release notes can include changes introduced by earlier spec PRs, and a documented change can be compatible in a particular language. The Java entry for Azure/azure-rest-api-specs#44920 explicitly describes a validation relaxation, not a Java source/binary break. Archived rows without linked changelog evidence show `Unverified`.

GitHub SDK breaking-change labels are retained only in historical metadata; they are not displayed, filtered, or used to derive changelog results.

The SDK breaking-change flag is derived from the assessment downstream SDK result: `Yes` for failed findings, `No` for an assessed pass, and `Not assessed` when comparison was blocked.

The regeneration flag is based on the [Python Azure SDK AutoPR regeneration analysis snapshot](https://gist.github.com/msyyc/d3e190c9bc22c16ce540f1d925f95d57#file-regeneration-events-csv) through October 8, 2026.

Release-plan links use the mappings in the [30-case assessment sample](https://github.com/Azure/azure-sdk-tools/issues/17343#issuecomment-6310632825). Search by release-plan ID to find its assessment.
