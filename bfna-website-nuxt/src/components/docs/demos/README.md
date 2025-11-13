# Component Demo Guidelines

- Hand-authored Vue SFCs live in this directory and follow the naming pattern `ccm-<component>-demo.vue`.
- Demos are fully declarative; avoid generators or shared metadata files. Document intent with inline comments when helpful.
- Use design-system layout utilities (`stack`, `cluster`, `grid`, etc.) to organise sections and keep spacing tokens consistent.
- Store any supporting assets (static HTML snapshots, imagery) alongside the broader docs system: HTML in `src/public/component-docs/`, imagery in `src/content/docs/guidelines/assets/`.
