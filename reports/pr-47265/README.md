# PR 47265 assessment

This directory contains the TypeSpec assessment result for
Azure/azure-rest-api-specs#47265.

The assessment is blocked before agent judgment because the current TypeSpec
source no longer defines the selected baseline API version,
`2026-05-01-preview`. AutoRest and TCGC therefore cannot produce the baseline
artifacts required for REST, downstream SDK, Azure Guidelines, and
documentation-completeness assessment.

The report is intentionally published as a directly addressable static report
instead of being added to the historical alignment dashboard. The dashboard
requires matching curated SDK alignment evidence and publication-manifest
records, which were not collected or fabricated for this assessment.
