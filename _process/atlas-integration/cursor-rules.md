# Atlas Testing Cursor Rules

**Purpose**: Cursor IDE rules for LLMs to follow when encountering `[Atlas-testing]` markers

## Task Marker: `[Atlas-testing]`

When a task in `tasks.md` contains `[Atlas-testing]`, it indicates that UI validation should be performed using ChatGPT Atlas browser automation.

## Workflow

### 1. Generate Test Spec

When completing a task marked `[Atlas-testing]`:

1. **Create test spec file**: `scripts/atlas/test-specs/{task-id}.json`
2. **Extract test context** from:
   - Task description
   - Related user story from spec.md
   - Acceptance scenarios from spec.md
   - Component/page being tested
3. **Determine test type**: `visual|ui|ux` based on task context
   - **visual**: Screenshot comparison, layout checks, responsive breakpoints
   - **ui**: Interactions (clicks, form inputs, keyboard navigation, focus states)
   - **ux**: End-to-end user flows from spec.md acceptance scenarios
4. **Generate appropriate checks** based on test type (see `test-spec-format.md` for details)

### 2. Run Atlas Tests

1. **Ensure dev server is running**: `npm run dev` (or preview: `npm run preview`)
2. **Open ChatGPT Atlas browser**
3. **Load test spec**: `scripts/atlas/test-specs/{task-id}.json`
4. **Execute tests in Atlas Agent Mode**
5. **Save results to**: `scripts/atlas/results/{task-id}.json`

### 3. Review Results

- Check `scripts/atlas/results/{task-id}.json` for pass/fail status
- If visual changes are intentional, update baseline: `scripts/atlas/baselines/{task-id}.png`
- If tests fail, fix issues before marking task complete

### 4. Mark Task Complete

Only mark `[Atlas-testing]` tasks complete after:
- ✅ Test spec created: `scripts/atlas/test-specs/{task-id}.json`
- ✅ Atlas tests executed: Results in `scripts/atlas/results/{task-id}.json`
- ✅ Results reviewed: All checks passing (or baselines updated if intentional changes)
- ✅ Test spec and results committed with task completion

## Directory Structure

```
scripts/atlas/
├── test-specs/     # Test specifications (JSON)
├── results/        # Test execution results (JSON + screenshots)
└── baselines/      # Screenshot baselines (PNG)
```

## Integration with Validation

Atlas tests complement existing validation:
- Visual tests → supplement `verify-visual-parity.ts`
- UI tests → complement Vitest component tests
- UX tests → validate acceptance scenarios from spec.md

## Cost Notes

- Atlas browser: Free (requires ChatGPT Plus $20/mo for Agent Mode)
- API usage: Minimal (~$5-10/month for complex reasoning)
- Estimated cost: ~$25-30/month for full UI testing automation

