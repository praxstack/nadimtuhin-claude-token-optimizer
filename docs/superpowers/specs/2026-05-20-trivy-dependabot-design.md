# Design: Trivy Security Scanning + Dependabot

**Date:** 2026-05-20
**Status:** Approved

## Summary

Add automated vulnerability scanning (Trivy) and dependency update PRs (Dependabot) via two GitHub configuration files. No code changes to the CLI itself.

## Motivation

- 4 npm dependencies (`@anthropic-ai/tokenizer`, `chalk`, `commander`, `glob`) can receive upstream CVEs between releases
- No current mechanism to detect or patch vulnerable deps
- GitHub Security tab (SARIF) surfaces findings without blocking PRs on false positives
- Dependabot closes the loop by opening patch PRs automatically

---

## Files

```
.github/
├── workflows/
│   └── trivy.yml        # Trivy filesystem scan → SARIF upload
└── dependabot.yml       # npm + github-actions auto-update config
```

---

## Trivy Workflow

**File:** `.github/workflows/trivy.yml`

**Triggers:**
- `pull_request` targeting `main`
- `schedule`: `cron: '0 9 * * 1'` (Monday 09:00 UTC)

**Permissions:** `security-events: write`, `actions: read`, `contents: read` (required for SARIF upload)

**Steps:**
1. `actions/checkout@v4`
2. `aquasecurity/trivy-action` — filesystem scan (`fs`), SARIF output to `trivy-results.sarif`, severity filter `CRITICAL,HIGH`
3. `github/codeql-action/upload-sarif@v3` — uploads SARIF to GitHub Security tab

**Behaviour:** No hard exit-code failure. Vulnerabilities surface as Security tab annotations. PRs are not blocked — Dependabot handles patching.

---

## Dependabot Config

**File:** `.github/dependabot.yml`

**Ecosystems:**

| Ecosystem | Directory | Schedule | Open PR limit |
|-----------|-----------|----------|---------------|
| `npm` | `/` | weekly (Monday) | 5 |
| `github-actions` | `/` | weekly (Monday) | 5 |

**Behaviour:** Opens version-bump PRs. No auto-merge — manual review required. Monday schedule aligns with Trivy scan day so patched deps get scanned same week.

---

## Data Flow

```
Monday 09:00 UTC
  └── Trivy workflow runs
        └── Scans filesystem (package-lock.json → CVE DB)
              └── Uploads trivy-results.sarif
                    └── GitHub Security tab shows findings

  └── Dependabot checks npm + actions versions
        └── Opens PRs for outdated/vulnerable deps
              └── Developer merges PR
                    └── Next Monday Trivy re-scans → findings clear
```

---

## Error Handling

- Trivy scan failure (network/DB fetch): workflow fails visibly in Actions tab; does not affect PR merge
- No `package-lock.json`: Trivy skips npm scan gracefully, still scans for other vuln types
- Dependabot PR conflicts: Dependabot rebases automatically

---

## Out of Scope

- Container image scanning (no Dockerfile in repo)
- Auto-merge of Dependabot PRs
- Slack/email notifications for findings
- SARIF diff between scans
