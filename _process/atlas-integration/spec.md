# Atlas UI Testing Integration Spec

**Created**: 2025-01-27  
**Status**: Draft  
**Purpose**: Define workflow for integrating ChatGPT Atlas browser automation with development tasks for UI validation, regression testing, and UX flow testing

## Overview

### Objective

Integrate ChatGPT Atlas browser automation into the development workflow to enable automated UI validation, visual regression testing, and UX flow testing. When tasks are marked with `[Atlas-testing]`, LLMs should automatically generate test specs and execute Atlas tests.

**Success Criteria:**
- Tasks marked `[Atlas-testing]` trigger automatic test spec generation
- Atlas tests can be executed against local dev/preview servers
- Test results are stored and reviewable
- Visual baselines can be updated for intentional changes
- Integration complements existing Vitest unit tests and validation scripts

### Cost Model

**Atlas Browser:**
- Free to download
- Requires ChatGPT Plus subscription ($20/month) for Agent Mode access
- ChatGPT Pro ($200/month) provides maximum Agent Mode access
- ChatGPT Business ($30/user/month) includes Agent Mode + admin controls

**API Usage:**
- Minimal API costs (~$5-10/month)
- Most UI automation (clicking, navigating, screenshots) runs locally without API calls
- API only used for complex reasoning/decision-making in Atlas Agent Mode

**Estimated Total Cost:** ~$25-30/month for full UI testing automation

## Workflow

### Task Marking

Tasks in `tasks.md` can be marked with `[Atlas-testing]` to indicate UI validation is required:

```markdown
- [ ] T042 [Atlas-testing] Verify search handles very long search queries without performance degradation
- [ ] T043 [Atlas-testing] Verify search handles direct navigation to `/search` page without search term
- [ ] T044 [Atlas-testing] Verify complete search workflow: header search → results → navigation → content page
```

### Test Spec Generation

When an LLM encounters a task marked `[Atlas-testing]`:

1. **Generate test spec file**: `scripts/atlas/test-specs/{task-id}.json`
2. **Determine test type** based on task context:
   - **visual**: Screenshot comparison, layout checks, responsive breakpoints
   - **ui**: Interactions (clicks, form inputs, keyboard navigation, focus states)
   - **ux**: End-to-end user flows from spec.md acceptance scenarios
3. **Extract test context** from:
   - Task description
   - Related user story from spec.md
   - Acceptance scenarios from spec.md
   - Component/page being tested

See `test-spec-format.md` for detailed format specification.

### Test Execution

1. **Prerequisites:**
   - Dev server running: `npm run dev` (or preview: `npm run preview`)
   - ChatGPT Atlas browser installed and configured
   - ChatGPT Plus subscription active (for Agent Mode)

2. **Execution Steps:**
   - Open ChatGPT Atlas browser
   - Load test spec: `scripts/atlas/test-specs/{task-id}.json`
   - Execute tests in Atlas Agent Mode
   - Atlas navigates to URL, performs checks, captures screenshots
   - Save results to: `scripts/atlas/results/{task-id}.json`

3. **Result Format:**
```json
{
  "taskId": "T042",
  "specFile": "scripts/atlas/test-specs/T042.json",
  "executedAt": "2025-01-27T10:30:00Z",
  "status": "pass|fail|error",
  "checks": [
    {
      "type": "element-exists",
      "status": "pass|fail",
      "message": "Element found/not found",
      "screenshot": "scripts/atlas/results/T042-check-0.png"
    }
  ],
  "errors": [],
  "duration": 1234
}
```

### Baseline Management

For visual regression tests:

1. **Initial Baseline:**
   - First run creates baseline screenshot: `scripts/atlas/baselines/{task-id}.png`
   - Baseline represents "known good" state

2. **Baseline Updates:**
   - If visual changes are intentional, update baseline: `npm run atlas:update-baseline {task-id}`
   - Or manually copy result screenshot to baseline directory
   - Commit updated baseline with code changes

3. **Visual Comparison:**
   - Atlas compares current screenshot against baseline
   - Threshold configurable (default: pixel-perfect or configurable diff tolerance)
   - Failures indicate visual regressions

### Task Completion

Tasks marked `[Atlas-testing]` should only be marked complete after:

1. ✅ Test spec created: `scripts/atlas/test-specs/{task-id}.json`
2. ✅ Atlas tests executed: Results in `scripts/atlas/results/{task-id}.json`
3. ✅ Results reviewed: All checks passing (or baselines updated if intentional changes)
4. ✅ Test spec and results committed with task completion

## Directory Structure

```
bfna-website-nuxt/
├── scripts/
│   └── atlas/
│       ├── test-specs/     # Test specifications (JSON)
│       │   ├── T042.json
│       │   └── T043.json
│       ├── results/         # Test execution results (JSON + screenshots)
│       │   ├── T042.json
│       │   ├── T042-check-0.png
│       │   └── T043.json
│       └── baselines/       # Screenshot baselines (PNG)
│           ├── T042.png
│           └── T043.png
```

## Integration with Existing Validation

Atlas tests complement existing validation tools:

- **Visual tests** → Supplement `scripts/verify-visual-parity.ts`
- **UI tests** → Complement Vitest component tests (`src/tests/components/`)
- **UX tests** → Validate acceptance scenarios from `spec.md`

### Validation Pipeline Integration

Add to validation checklist:

```markdown
## Atlas Testing

- [ ] All `[Atlas-testing]` tasks have corresponding test specs
- [ ] Atlas tests pass: Review `scripts/atlas/results/` for all marked tasks
- [ ] Visual baselines updated if intentional changes
- [ ] Test results committed with task completion
```

## Package.json Scripts

Add to `bfna-website-nuxt/package.json`:

```json
{
  "scripts": {
    "atlas:test": "echo 'Run tests in Atlas browser: Load scripts/atlas/test-specs/{task-id}.json'",
    "atlas:update-baseline": "echo 'Copy result screenshot to baselines directory'",
    "validate:atlas": "echo 'Review all Atlas test results in scripts/atlas/results/'"
  }
}
```

Note: Actual execution happens in Atlas browser, not via npm scripts. Scripts serve as reminders/documentation.

## Open Questions

1. **Atlas API Integration**: Can we programmatically trigger Atlas tests, or is manual execution in browser required?
2. **CI/CD Integration**: How to run Atlas tests in CI/CD pipelines? (May require headless browser alternative)
3. **Test Spec Generation**: Should we create a script to auto-generate specs from component metadata?
4. **Baseline Management**: Should baselines be version-controlled or stored separately?
5. **Multi-viewport Testing**: How to handle responsive testing across breakpoints?

## Future Enhancements

- Auto-generate test specs from component docs/metadata
- Integrate with CI/CD for automated regression testing
- Visual diff tooling for baseline comparison
- Test result reporting/dashboard
- Parallel test execution for multiple viewports
- Accessibility audit integration (a11y checks in Atlas)

## References

- ChatGPT Atlas: https://openai.com/index/introducing-chatgpt-atlas/
- Existing validation scripts: `bfna-website-nuxt/scripts/verify-visual-parity.ts`
- Component testing: `bfna-website-nuxt/src/tests/components/`
- Validation guidelines: `bfna-website-nuxt/src/content/docs/guidelines/ai/validation.md`
- Test spec format: `_process/atlas-integration/test-spec-format.md`
- Cursor rules: `_process/atlas-integration/cursor-rules.md`
- Quickstart: `_process/atlas-integration/quickstart.md`

