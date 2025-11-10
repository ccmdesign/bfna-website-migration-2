# Atlas Integration Quickstart

**Purpose**: Quick implementation guide for setting up Atlas UI testing

## Prerequisites

1. **Install ChatGPT Atlas Browser**
   - Download from: https://openai.com/index/introducing-chatgpt-atlas/
   - Install and configure

2. **Subscribe to ChatGPT Plus**
   - Required for Agent Mode access
   - Cost: $20/month
   - Sign up at: https://chat.openai.com/

3. **Project Setup**
   - Ensure dev server can run: `npm run dev`
   - Create directory structure (see below)

## Initial Setup

### 1. Create Directory Structure

```bash
mkdir -p bfna-website-nuxt/scripts/atlas/{test-specs,results,baselines}
```

### 2. Add to .gitignore

```gitignore
# Atlas test results (optional - you may want to commit these)
scripts/atlas/results/*.png
```

### 3. Add Package.json Scripts

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

### 4. Add Cursor Rules

Create `.cursor/rules/atlas-testing.mdc` with content from `_process/atlas-integration/cursor-rules.md`

## First Test

### 1. Mark a Task

In `tasks.md`, mark a task with `[Atlas-testing]`:

```markdown
- [ ] T042 [Atlas-testing] Verify search page renders correctly
```

### 2. Generate Test Spec

When working on the task, create `scripts/atlas/test-specs/T042.json`:

```json
{
  "name": "T042 - Search page renders correctly",
  "taskId": "T042",
  "url": "http://localhost:3000/search",
  "type": "visual",
  "description": "Verify search page layout matches design",
  "checks": [
    {
      "type": "element-exists",
      "selector": "[data-testid='search-input']",
      "description": "Search input is visible"
    }
  ]
}
```

### 3. Run Test

1. Start dev server: `npm run dev`
2. Open ChatGPT Atlas browser
3. Load test spec: `scripts/atlas/test-specs/T042.json`
4. Execute in Agent Mode
5. Review results: `scripts/atlas/results/T042.json`

### 4. Update Baseline (if visual test)

If this is a visual regression test and results look good:

```bash
cp scripts/atlas/results/T042-check-0.png scripts/atlas/baselines/T042.png
```

## Common Patterns

### Visual Regression Test

```json
{
  "name": "T042 - Component visual layout",
  "taskId": "T042",
  "url": "http://localhost:3000/component-demo",
  "type": "visual",
  "baseline": "scripts/atlas/baselines/T042.png",
  "checks": [
    {
      "type": "visual-regression",
      "selector": ".component-container",
      "baseline": "scripts/atlas/baselines/T042.png",
      "threshold": 0.01
    }
  ]
}
```

### UI Interaction Test

```json
{
  "name": "T043 - Form interaction",
  "taskId": "T043",
  "url": "http://localhost:3000/form",
  "type": "ui",
  "checks": [
    {
      "type": "interaction",
      "selector": "[data-testid='form-input']",
      "action": "type",
      "value": "test value",
      "expect": {
        "element-visible": "[data-testid='form-submit']",
        "console-errors": 0
      }
    }
  ]
}
```

### UX Flow Test

```json
{
  "name": "T044 - Complete user flow",
  "taskId": "T044",
  "url": "http://localhost:3000/",
  "type": "ux",
  "checks": [
    {
      "type": "navigation",
      "steps": [
        { "action": "navigate", "url": "http://localhost:3000/" },
        { "action": "click", "selector": ".nav-link" },
        { "expect": { "url-change": "/target-page" } }
      ]
    }
  ]
}
```

## Troubleshooting

### Atlas Browser Not Opening

- Verify ChatGPT Plus subscription is active
- Check Atlas browser is installed correctly
- Restart Atlas browser

### Tests Failing

- Verify dev server is running on correct port
- Check test spec JSON is valid
- Review results JSON for error messages
- Ensure selectors match actual page elements

### Baseline Updates

- Only update baselines for intentional visual changes
- Commit baseline updates with code changes
- Document why baseline was updated

## Next Steps

- Review full spec: `_process/atlas-integration/spec.md`
- Check test format: `_process/atlas-integration/test-spec-format.md`
- See Cursor rules: `_process/atlas-integration/cursor-rules.md`

