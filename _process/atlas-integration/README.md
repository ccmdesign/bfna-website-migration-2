# Atlas UI Testing Integration

**Created**: 2025-01-27  
**Status**: Draft

## Overview

Integration workflow for ChatGPT Atlas browser automation with development tasks. Enables automated UI validation, visual regression testing, and UX flow testing when tasks are marked with `[Atlas-testing]`.

## Documentation

- **[spec.md](./spec.md)** - Main specification: objectives, workflow, integration points
- **[test-spec-format.md](./test-spec-format.md)** - Detailed test spec JSON format and examples
- **[cursor-rules.md](./cursor-rules.md)** - Cursor IDE rules for LLMs (copy to `.cursor/rules/atlas-testing.mdc`)
- **[quickstart.md](./quickstart.md)** - Quick implementation guide and setup instructions

## Quick Reference

### Task Marking

```markdown
- [ ] T042 [Atlas-testing] Verify component renders correctly
```

### Test Spec Location

```
scripts/atlas/test-specs/{task-id}.json
```

### Test Types

- **visual**: Screenshot comparison, layout checks
- **ui**: Interactions, keyboard navigation, focus states
- **ux**: End-to-end user flows, multi-step workflows

### Cost

- ChatGPT Plus: $20/month (required for Agent Mode)
- API usage: ~$5-10/month (minimal)
- **Total: ~$25-30/month**

## Workflow

1. Mark task with `[Atlas-testing]`
2. LLM generates test spec: `scripts/atlas/test-specs/{task-id}.json`
3. Execute tests in Atlas browser Agent Mode
4. Review results: `scripts/atlas/results/{task-id}.json`
5. Update baselines if intentional changes
6. Mark task complete

## Directory Structure

```
bfna-website-nuxt/scripts/atlas/
├── test-specs/     # Test specifications (JSON)
├── results/        # Test execution results (JSON + screenshots)
└── baselines/     # Screenshot baselines (PNG)
```

## Integration Points

- Visual tests → Supplement `scripts/verify-visual-parity.ts`
- UI tests → Complement Vitest component tests
- UX tests → Validate acceptance scenarios from spec.md

## References

- ChatGPT Atlas: https://openai.com/index/introducing-chatgpt-atlas/
- Existing validation: `bfna-website-nuxt/scripts/verify-visual-parity.ts`
- Component tests: `bfna-website-nuxt/src/tests/components/`
