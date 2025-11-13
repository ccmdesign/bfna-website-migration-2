# Prompt Output Review Checklist

1. Frontmatter includes `promptId`, `promptVersion`, `promptRunId`, and correct `legacySource` references.
2. `dataHash` reflects the latest metadata export; rerun generator if inputs changed mid-review.
3. Generated sections answer the prompt outline (TL;DR, Overview, Anatomy, etc.) or carry TODO placeholders for follow-up.
4. Props tables align with component specs and surface required/default values accurately.
5. Demo metadata lists all variants/states required by the prompt and links to the correct SFC.
6. Guidelines docs reference the latest exports in `scripts/output/` and include relevant checklists.
7. Update `src/content/docs/prompts/migration-map.md` with status changes after signing off.
