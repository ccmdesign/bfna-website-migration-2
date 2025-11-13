# Nuxt 4 Migration Plan

I've created a comprehensive migration plan that will be saved as `_process/quick-specs/nuxt4-migration.md`. The plan includes:

## Key Migration Areas:
1. **Directory Structure** - Move from `src/` to `app/` (most significant change)
2. **Configuration Updates** - Remove custom srcDir/rootDir settings
3. **Dependency Updates** - Update all @nuxt packages to latest versions
4. **Content System** - Move content/ to root level and update paths
5. **Testing Configuration** - Update vitest config for new structure
6. **Documentation** - Update CLAUDE.md and all path references

## Migration Strategy:
- **Phase 1**: Update to Nuxt 3.12+ and enable compatibility mode
- **Phase 2**: Directory structure migration (src/ → app/)
- **Phase 3**: Configuration and dependency updates
- **Phase 4**: Code validation and testing
- **Phase 5**: Documentation updates

## Tools & Automation:
- Use `npx codemod@latest nuxt/4/migration-recipe` for automated fixes
- Test incrementally with `future.compatibilityVersion: 4`
- Maintain rollback capability with backup directories

## Timeline: ~2.5 days total
The plan includes detailed steps, code examples, risk assessment, and success criteria for a complete migration to Nuxt 4.