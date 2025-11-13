# Docs Pipeline Deletion Candidates (2025-11-02)

## Already Removed (keep out of repo)

| File | Rationale |
| --- | --- |
| `src/public/component-docs/ccmAccordion.json` | No matching DS component; generator now prunes it. |
| `src/public/component-docs/ccmCookieConsent.json` | Legacy LLM artifact, not produced by generator. |
| `src/public/component-docs/ccmIcon.json` | No companion `src/components/ds/ccmIcon.vue`. |
| `src/public/component-docs/ccmMenu.json` | Legacy stub; there is no DS menu component. |
| `src/public/component-docs/ccmMenuButton.json` | Legacy stub; no DS source. |
| `src/public/component-docs/ccmMenuItem.json` | Legacy stub; no DS source. |
| `src/public/component-docs/ccmModal.json` | Legacy stub; no DS source. |
| `src/public/component-docs/ccmSearchBox.json` | Legacy stub; no DS source. |
| `src/public/component-docs/ccmToggleButton.json` | Legacy stub; no DS source. |
| `src/pages/docs/demos/ccm-accordion-demo.vue` | Demo referenced a non-existent DS component. |
| `src/pages/docs/demos/ccm-search-box-demo.vue` | Demo referenced a non-existent DS component. |

## Pending Deletions (safe once confirmed with authors)

| File | Rationale | Suggested Action |
| --- | --- | --- |
| `src/components/content/callout.vue` | No render-time references found (`rg` search 2025-11-02). | Delete or move to docs archive. |
| `src/components/content/ctaSignup.vue` | No render-time references found. | Delete or rewrite as markdown include. |
| `src/components/content/proseHgroup.vue` | No render-time references found. | Delete after confirming no content relies on it. |
| `src/components/content/proseSection.vue` | No render-time references found. | Delete after confirming no content relies on it. |
| `src/components/content/tldrSection.vue` | No render-time references found. | Delete after confirming no content relies on it. |
| `src/components/content/docs-component-source.vue` | Placeholder component that only renders stub text; not consumed anywhere. | Delete after verifying no planned usage. |
| `src/components/content/docs-live-demo.vue` | Placeholder wrapper that just dumps HTML; not consumed anywhere. | Delete after verifying no planned usage. |

> Verification method: repository-wide ripgrep queries (via Cursor `grep`) for `<ComponentName` returned no hits on 2025-11-02.

