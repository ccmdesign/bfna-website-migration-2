# Quick Spec Workflow

Use this lightweight template for scoping small, low-risk work while still following the Spec → Plan → Tasks flow. Reach for it when the change touches a narrow surface area, is easily reversible, and does not require new infrastructure, schema updates, or cross-team coordination. If uncertainty shows up—or the work spans multiple modules, environment variables, or production ingestion flows—fall back to the full Speckit process.

## Inputs the LLM Needs
- Problem summary (1–2 sentences) and any acceptance criteria already stated by the requester.
- Mentioned files, routes, or modules that are likely involved.
- Relevant telemetry or constitution touchpoints (normalization, structured outputs, validation, logging, security).
- Desired validation level (e.g., smoke test only, manual check, no tests).

## Single-Prompt Output Format
The LLM should respond with the following markdown structure, keeping each section concise (≤5 bullets per list):

````markdown
# Quick Spec – [Concise Title]

## Spec
- **Goal**: One sentence describing the outcome.
- **Success Signals**: 2–3 bullet acceptance criteria tied to user value.
- **Constraints**: Call out relevant constitution checks or guardrails (e.g., normalization, telemetry, security).

## Plan
1. 3–5 ordered steps covering the intended implementation path.
2. Reference concrete files or directories when possible.
3. Note any validation checkpoints inline (e.g., "Run npm test…").

## Tasks
- [ ] `T1` Short task description (include file path when obvious).
- [ ] `T2` …
- [ ] `T3` …

## Validation
- Minimal verification or manual QA expected (e.g., "Verify locally via npm run dev", "Spot-check telemetry log").
- Call out skipped tests or debt explicitly.

## Follow-ups (Optional)
- Risks, open questions, or triggers to escalate into the full Speckit.
````

### Authoring Guidelines
- Keep prose direct; avoid boilerplate just to fill placeholders.
- When work is purely documentation or textual edits, a 2–3 step Plan is fine.
- If any constitution gate cannot be satisfied, flag it under Constraints and escalate.
- Always link back to telemetry expectations when touching AI enrichment flows; note required logging or metric updates.

### When to Escalate to Full Speckit
- Multiple user stories, data-model shifts, or new modules.
- Work requires coordinated testing (end-to-end, load, PDF ingestion suite).
- Any uncertainty about rollback safety, telemetry impacts, or security posture.

Store this file as `_process/quick-spec.md` and reference it in prompts for compact specs. This workflow is independent of the Speckit automation and should not overwrite existing `.specify` assets.

### Storage & Naming
- Never modify or overwrite `_process/quick-speck-bkup.md`; treat it as the canonical template.
- When producing a new quick spec, always create a fresh file under `_process/quick-specs/` named `QS000-spec-name.md`, where the three-digit number is zero-padded and increments from the highest existing quick spec (e.g., `QS001-telemetry-latency.md`, then `QS002-...`).
- Keep the slug lowercase with words separated by hyphens; do not reuse numbers or replace existing quick spec files.
