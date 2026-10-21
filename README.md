# TypeSpec Assessment Reports

Static GitHub Pages dashboard for 15 Azure REST API specification assessments used in the Python SDK regeneration experiment.

- 10 cases with observed Python SDK AutoPR regeneration
- 5 cases without observed regeneration in the October 8, 2026 snapshot
- Each dashboard row includes explicit SDK regeneration, assessed SDK breaking-change, and GitHub SDK breaking-change label flags
- Each report includes rendered HTML and structured `assessment.json`

The SDK breaking-change flag is derived from the assessment downstream SDK result: `Yes` for failed findings, `No` for an assessed pass, and `Not assessed` when comparison was blocked.

The regeneration flag is based on the [Python Azure SDK AutoPR regeneration analysis snapshot](https://gist.github.com/msyyc/d3e190c9bc22c16ce540f1d925f95d57#file-regeneration-events-csv) through October 8, 2026.

The site is generated from reports stored under `C:\workspace\documents`.
