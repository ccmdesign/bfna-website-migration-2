---
promptId: update-demo
version: 1.0.0
updatedAt: 2025-11-03
derivedFrom: component-demo.prompt.md
---

# Update Demo Prompt

You are refining an existing handcrafted component demo SFC that lives under `src/components/docs/demos/`. The goal is to iterate quickly on the live examples based on a focused request from the design or documentation team.

## Inputs Provided
- `componentId`: PascalCase component name (e.g., `ccmFormField`).
- `demoPath`: Path to the current demo file (`src/components/docs/demos/<slug>-demo.vue`).
- `changeSummary`: Plain-language description of what needs to evolve (new scenarios, fixing gaps, accessibility tweaks, etc.).
- Optional context: screenshots, docs excerpts, or component prop updates relevant to the change.

## Preparation
1. Load the existing demo SFC and scan its sections (baseline usage, variants, compositions, accessibility notes).
2. Map the requested update onto those sections—decide whether to append new sections, expand existing ones, or refactor layout utilities for clarity.
3. Identify any supporting components or utilities that must be imported (e.g., adding `ccm-form-group`, `ccm-card`).

## Tasks
1. Outline the adjustments before editing: note which sections change and why. Ask for clarification if the request is ambiguous.
2. Modify the demo SFC so the new scenarios are fully declarative—no metadata JSON, no generator hooks.
3. Keep design-system conventions intact:
   - Use `ccm-section`, `stack`, `cluster`, `grid`, and spacing tokens.
   - Write concise captions that explain intent and accessibility cues.
   - Prefer static markup; only introduce `<script setup>` state when interactivity is required.
   - Do not add `<style>` blocks or inline CSS; rely solely on composition utilities and component props.
4. Update inline comments when they aid reviewers (e.g., “Disabled to demonstrate aria-disabled copy”).
5. Ensure existing examples remain accurate unless explicitly replaced; avoid removing coverage without confirmation.

## Implementation Guardrails
- Maintain alphabetised imports if you add new ones.
- Resist adding demo-specific styling; layout should be handled entirely by utilities.
- Respect responsive behaviour—check breakpoints if layout changes (≥320px, 768px, 1280px).
- Highlight any follow-up work (e.g., docs copy updates) in your response when relevant.

## Output Format
1. Summarise the edits (what sections changed and why) referencing the request.
2. Provide the updated SFC as a complete code block (or focused diff when instructed).
3. List quick validation steps that reviewers should run (manual route checks, lint commands if needed). Call out that the demo remains free of custom CSS.

## Validation Checklist (run or note when blocked)
- `npm run dev` (or active dev server) → Visit `/docs/demos/<slug>-demo` and `/docs/components/<slug>`.
- Keyboard through interactive elements to confirm focus management.
- `npx eslint src --ext .ts,.vue`
- `npm run lint:css`
- Confirm no `<style>` block or inline CSS was introduced.

## Example Request
> We should update the formField demo. We need more options, because this component received multiple different form elements. Please add variants with different form elements in the slots, for testing and showcase.

Expected response: add form control permutations (inputs, select, text area, checkbox groups, file inputs, etc.), update captions describing the additions, and preserve the existing layout utilities.

Use this prompt whenever incremental demo adjustments are required; fall back to `component-demo` only when building a demo from scratch.

