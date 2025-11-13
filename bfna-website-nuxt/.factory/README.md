# Factory Agent System

**Purpose**: Factory commands and configurations for this Nuxt 3 project repository.

**Last Updated**: 2025-10-28

---

## Overview

This directory contains Factory-specific agent configurations, including commands for spec-driven development workflows and project management.

### System Architecture

```
.factory/
├── agents/            # Agent-specific configurations
├── commands/          # Development commands and workflows
└── docs/              # Factory-specific documentation
```

---

## Commands (`commands/`)

Commands provide structured workflows for development tasks using the Factory agent system. These are primarily focused on spec-driven development using the Speckit framework.

### Speckit Framework Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `speckit.analyze.md` | Analyze spec consistency across artifacts | Analyze phase |
| `speckit.checklist.md` | Generate implementation checklist from plan | Task generation |
| `speckit.clarify.md` | Clarify requirements and ambiguities | Requirements phase |
| `speckit.constitution.md` | Update project constitution and principles | Governance |
| `speckit.implement.md` | Implement features from technical plan | Implementation phase |
| `speckit.plan.md` | Create technical implementation plan | Planning phase |
| `speckit.specify.md` | Create feature specifications from ideas | Specification phase |
| `speckit.tasks.md` | Generate detailed task list from plan | Task breakdown |

### Speckit Workflow

The Speckit framework follows this structured workflow:

1. **Specify** → Define feature requirements and user stories
2. **Clarify** → Resolve ambiguities and gaps in requirements
3. **Plan** → Create technical implementation plan
4. **Tasks** → Generate detailed task breakdown
5. **Analyze** → Validate consistency across artifacts
6. **Implement** → Execute development tasks

**Note**: Speckit is a third-party spec-driven development framework. These commands are distributed across all agent systems (`.claude/`, `.codex/`, `.factory/`) as required by each system, with agent-specific customizations where needed.

---

## Integration with Project Knowledge Base

This agent system references the project documentation for project-wide consistency:

**Essential References**:
- [README.md](../../README.md) - Project overview
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines
- [AGENTS.md](../../AGENTS.md) - Cross-agent guidelines
- Project documentation in `src/content/docs/` - Comprehensive component and system documentation

**Always reference project documentation first** for project-wide knowledge and consistency.

---

## Project-Specific Guidelines

For this Nuxt 3 project, Factory follows these specific patterns:

### Spec-Driven Development
- Use Speckit framework for feature development
- Follow structured workflow from specification to implementation
- Maintain consistency across all artifacts
- Validate cross-artifact consistency before implementation

### Component Development
- Reference component standards in shared knowledge base
- Use design system components (`ccm` prefix) when appropriate
- Follow composition-first approach
- Validate components against all 8 standards

### Quality Assurance
- Run validation checks: `npm run validate:ai-instructions`
- Ensure all paths and references are current
- Maintain consistency with other agent systems
- Document architectural decisions

---

## Usage Patterns

### Starting New Features
1. Use `speckit.specify` to define requirements
2. Use `speckit.clarify` to resolve ambiguities
3. Use `speckit.plan` to create technical plan
4. Use `speckit.tasks` to generate task list
5. Use `speckit.analyze` to validate consistency
6. Use `speckit.implement` to execute development

### Maintenance and Updates
1. Use `speckit.constitution` to update project principles
2. Use `speckit.checklist` to track implementation progress
3. Run validation to ensure system health
4. Update documentation as needed

---

## Configuration

### Agent Instructions
- **Primary**: [CLAUDE.md](../../CLAUDE.md) - Detailed project guidance
- **General**: [AGENTS.md](../../AGENTS.md) - Cross-agent guidelines
- **Documentation**: Project documentation in `src/content/docs/` - Comprehensive component and system documentation

### Command Structure
Each Speckit command follows this structure:
- **Description**: Clear purpose and context
- **User Input**: Handling of command arguments
- **Execution Steps**: Detailed workflow instructions
- **Output Requirements**: Expected deliverables

---

## Agent-Specific Customizations

### Factory vs Other Agents
- **Format**: Uses Markdown commands (similar to Claude)
- **Context**: Optimized for Factory agent capabilities
- **Integration**: References shared knowledge base
- **Workflow**: Follows spec-driven development methodology

### Content Differences
- Most Speckit commands are identical across agent systems
- `speckit.plan.md` has Factory-specific agent context configuration
- All other commands maintain consistency with framework standards

### Agent Context Updates
Factory commands include agent-specific context updates:
```bash
# Example from speckit.plan.md
Run `.specify/scripts/bash/update-agent-context.sh factory`
```

This ensures Factory agent receives appropriate context updates during workflow execution.

---

## Documentation (`docs/`)

Factory-specific documentation and resources are stored in the `docs/` directory.

### Available Documentation
- Project-specific guidelines
- Agent configuration details
- Workflow documentation
- Integration guides

---

## Troubleshooting

### Common Issues

**Command not found**: Ensure command file exists in `commands/` directory
**Context issues**: Reference project documentation in `src/content/docs/`
**Workflow gaps**: Check Speckit framework documentation

### Validation

Run the AI instruction validation to check system health:
```bash
npm run validate:ai-instructions
```

### Getting Help

1. Check project documentation in `src/content/docs/`
2. Reference project-specific guidelines in `CLAUDE.md`
3. Consult Speckit framework documentation
4. Run validation to identify issues

---

## Maintenance

### Adding New Commands
1. Create `.md` file in `commands/` directory
2. Follow existing command structure and format
3. Include proper description and execution steps
4. Test command workflow and functionality
5. Update this README with command details

### Updates
- Review and update commands when project requirements change
- Maintain consistency with Speckit framework standards
- Update documentation when adding new workflows
- Run validation after changes

### Framework Updates
- Monitor Speckit framework for new versions
- Update commands when framework changes
- Maintain compatibility with other agent systems
- Document version changes in shared knowledge base

---

## Related Files

- **Project Instructions**: [CLAUDE.md](../../CLAUDE.md), [AGENTS.md](../../AGENTS.md)
- **Project Documentation**: `src/content/docs/` directory
- **Validation**: [`npm run validate:ai-instructions`](../../package.json)

---

## Speckit Framework Version

**Current Version**: Compatible with Speckit v0.0.79 (latest as of 2025-10-28)

**Status**: Up-to-date and functioning correctly. No immediate upgrade required.

**Key Fix Applied**: Updated `speckit.plan.md` agent context script to use `factory` instead of `codex`.

**Speckit framework information**: Available in project documentation

---

**Last Updated**: 2025-10-28  
**Maintainer**: Factory Agent System
