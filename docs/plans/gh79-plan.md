# Plan: gh#79 — stop ignoring bfna-website-nuxt/scripts/

Remove the `bfna-website-nuxt/scripts/` line from the root `.gitignore` (verified empirically that the sibling `scripts/*` rule at line 43 is root-anchored and does not catch this nested path, so nothing else re-ignores it). No other files change.

Test strategy: `git check-ignore -v bfna-website-nuxt/scripts/anything.ts` must print nothing after the edit, and `git status --short` must show no newly-untracked files under that directory (all 18 existing files stay tracked regardless of the ignore rule).
