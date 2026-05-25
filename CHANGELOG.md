# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.16] — 2026-05-20

### Added

- `cto audit` checks 18+19: warn when `.clinerules` (Cline AI) and `.roomodes` (Roo Code) not in `.claudeignore` — both auto-fixable with `cto audit --fix` (CEO-095)
- 190 tests across 26 suites

## [2.3.15] — 2026-05-20

### Changed

- `cto audit --fix` now shows remaining warnings/infos count after applying fixes — users see the full picture instead of just "No more errors" (CEO-093)
- 186 tests across 26 suites unchanged

## [2.3.14] — 2026-05-20

### Added

- `cto audit` check 17: warns (info) when `.windsurfrules` not in `.claudeignore` — Windsurf IDE rules file; `--fix` auto-appends (CEO-091)
- `cto init` generates `.claudeignore` with `.windsurfrules` in user-facing docs section (CEO-091)

### Fixed

- ARCHITECTURE_MAP.md: corrected stale "15 structural checks" → 17 (CEO-091)
- 186 tests across 26 suites (up from 184 at v2.3.13)

## [2.3.13] — 2026-05-20

### Added

- `cto audit` check 16: warns (info) when `.cursorrules` not in `.claudeignore` — Cursor IDE rules file; `--fix` auto-appends (CEO-089)
- `cto init` generates `.claudeignore` with `.cursorrules` in user-facing docs section (CEO-089)

### Changed

- `cto audit` output: dim hint "Run cto audit --fix to resolve N fixable issues" shown after summary when fixable checks fail — drives discoverability of `--fix` (CEO-088)
- 184 tests across 26 suites (up from 182 at v2.3.12)

## [2.3.12] — 2026-05-20

### Added

- `cto audit --fix` now auto-adds `.claude/sessions/**`, `.claude/completions/**`, and `docs/archive/**` to existing `.claudeignore` when missing — completes `--fix` coverage for all 3 directory-pattern warnings (CEO-086)

### Fixed

- ARCHITECTURE_MAP.md: corrected stale "10 structural checks" → 15 (CEO-085)
- 182 tests across 26 suites (up from 179 at v2.3.11)

## [2.3.11] — 2026-05-20

### Changed

- `audit.js`: table-driven `FILE_EXCLUSIONS` + `makeExcludeFixable` factory replaces 5 identical FIXABLE handlers — ~55 fewer lines, adding a 6th file exclusion is now one array entry (CEO-082)
- `cto audit --fix`: output no longer prints misleading "created" prefix when modifying an existing `.claudeignore` (CEO-083)
- 179 tests across 26 suites unchanged

## [2.3.10] — 2026-05-20

### Added

- `cto audit` check 14: warns (info severity) when `GEMINI.md` not in `.claudeignore` — Gemini Code instructions file
- `cto audit` check 15: warns (info severity) when `AGENTS.md` not in `.claudeignore` — AI agent instructions file
- `cto audit --fix` auto-appends `GEMINI.md` and `AGENTS.md` when the corresponding checks fail
- Completes `cto audit` coverage of all user-facing docs excluded by `cto init` since v2.3.7

### Tests

- 179 tests across 26 suites (up from 175 at v2.3.9)

---

## [2.3.9] — 2026-05-20

### Added

- `cto audit` check 12: warns (info severity) when `CHANGELOG.md` not in `.claudeignore` — typical CHANGELOG = 2,000–8,000 tokens
- `cto audit` check 13: warns (info severity) when `CONTRIBUTING.md` not in `.claudeignore` — typically 1,000–3,000 tokens
- `cto audit --fix` now patches existing `.claudeignore` — appends `README.md`, `CHANGELOG.md`, or `CONTRIBUTING.md` when the corresponding check fails (previously `--fix` could only create missing files, not modify existing ones)

### Changed

- `cto init` generated `.claudeignore` now excludes `CHANGELOG.md` — new projects get this token saving automatically

### Tests

- 175 tests across 26 suites (up from 169 at v2.3.8)

---

## [2.3.8] — 2026-05-20

### Added

- `cto audit` check 11: warns (info severity) when `README.md` is not in `.claudeignore` — the most common token-waste pattern (typical README = 1,000–10,000 tokens per session)

### Changed

- Essential dev docs (`.claude/ARCHITECTURE_MAP.md`, `.claude/QUICK_START.md`, `CLAUDE.md`) no longer hardcode test counts or version numbers — prevents recurring stale-number churn on every test addition or version bump

### Tests

- 169 tests across 26 suites (up from 167 at v2.3.7)

---

## [2.3.7] — 2026-05-20

### Changed

- `cto init` generated `.claudeignore` now excludes `README.md`, `CONTRIBUTING.md`, `GEMINI.md`, `AGENTS.md` — new projects get this token savings automatically without manual `.claudeignore` edits; saves ~3,000–7,000 tokens per session depending on README size

### Tests

- 167 tests across 26 suites (up from 165 at v2.3.6)

---

## [2.3.6] — 2026-05-20

### Fixed

- `cto measure` no longer shows "Run cto init to apply" on initialized projects (CLAUDE.md exists) — `cto init` would have failed with "already exists" error; now shows "✓ Already initialized. Run cto compress to reduce further."
- `cto measure` hides AFTER section for initialized projects — template estimates are not meaningful when docs are already customized
- `runMeasure(dir)` exported for testability; `measureCommand()` remains the no-arg CLI action handler (fixes Commander incompatibility where options object was silently passed as first argument)

### Changed

- `cto measure` CLI description updated: "vs. post-optimization estimate" → "guides new projects to cto init, existing to cto compress"
- `.claude/ARCHITECTURE_MAP.md`, `.claude/QUICK_START.md`, `CLAUDE.md` — updated test count 163/24 → 165/25 and version 2.3.3 → 2.3.6

### Tests

- 165 tests across 25 suites (up from 163 at v2.3.5)

---

## [2.3.5] — 2026-05-20

### Changed

- Project `.claudeignore` excludes `README.md`, `CONTRIBUTING.md`, `GEMINI.md`, `AGENTS.md` — reduces dev-session auto-load from 7,838 → 1,977 tokens (75% further reduction; project startup cost now ~2k tokens, down from 33,717 at v2.3.2)

---

## [2.3.4] — 2026-05-20

### Added

- CONTRIBUTING.md: new "CLI Development" section with `npm install` + `npm test` instructions for contributors modifying `src/`

### Changed

- `init.sh`: runtime deprecation warning now shown in yellow at script start — users running the legacy bash script see an immediate redirect to `npx claude-token-optimizer init` (was comment-only)
- Project `.claudeignore` optimized: excluded `docs/superpowers/**`, `CHANGELOG.md`, `UNIVERSAL_SETUP.md`, `QUICK_START.md` — reduces this project's own auto-load from 33,717 → 7,809 tokens (77% reduction; demonstrates the tool)
- Project essential docs (`CLAUDE.md`, `.claude/QUICK_START.md`, `.claude/ARCHITECTURE_MAP.md`, `.claude/COMMON_MISTAKES.md`) filled with real project content replacing placeholder templates

---

## [2.3.3] — 2026-05-20

### Added

- `cto audit` now has 10 structural checks (up from 8 at v2.3.2):
  - Check 9: `.claudeignore covers .claude/completions/` — warns if completion docs can auto-load
  - Check 10: `.claudeignore covers docs/archive/` — warns if archived docs can auto-load
- `package.json` adds `homepage` and `bugs` fields for npm discoverability

### Changed

- Framework documentation: README, `examples/README.md`, and `CONTRIBUTING.md` now all reflect 13 supported frameworks (added FastAPI/Flask, Go, Spring Boot, Svelte — were already in `examples/` but invisible to users)
- CHANGELOG: added retroactive `[1.5.0]` entry for the 4 undocumented framework additions; Version History footer updated
- Hook scripts `pre-tool-token-guard.sh` and `user-prompt-validate-claude-md.sh`: user-visible output uses `cto` instead of `npx claude-token-optimizer`
- README: `--framework` override examples, Hooks "Quick install" block, and hook output example all use `cto` (was `npx claude-token-optimizer`)
- README audit check count: 8 → 10

### Tests

- 163 tests across 24 suites (up from 161 at v2.3.2)

---

## [2.3.2] — 2026-05-20

### Fixed

- `cto audit` failing check rows now show `<label> — <detail>` so users can identify which specific check failed
- `cto audit --fix` error listing uses same `label — detail` format (previously showed detail-only, losing the check name)
- `cto audit --fix` option description: "error-level checks" → "failing checks" (--fix handles info-level too)
- `cto measure` CTA: `npx claude-token-optimizer init` → `cto init` (users who ran `cto measure` have it installed)
- `cto init` verify-savings hint: `npx claude-token-optimizer measure` → `cto measure`
- `cto diff` CLI description: "between CLAUDE.md and its .bak" → "between a file and its .bak backup" (supports any file via `--file`)
- README version badge updated to current version

---

## [2.3.1] — 2026-05-20

### Fixed

- `cto audit` summary now includes info-level failure count — previously showed "all checks passed" even when ⚠ info items failed
- `cto audit --json` output now includes `infos` count field alongside `errors` and `warnings`

### Changed

- CI test matrix: Node 20 + 22 → Node 20 + 22 + 24
- README: removed curl/bash install option from Quick Setup (legacy path caused user confusion)
- `init.sh`: added deprecation notice pointing to `npx claude-token-optimizer init`

---

## [2.3.0] — 2026-05-20

### Added

- `cto watch` — live token monitoring dashboard; refreshes within 500ms of file changes; ASCII bar charts with per-file targets; `--interval <seconds>` polling fallback for filesystems without `fs.watch` support; session writes section (from hook log)
- `user-prompt-ghost-scanner.sh` hook — detects CLAUDE.md sections with zero references across recent sessions; reports ghost tokens via stdout (Claude sees as context); fires once per day via marker file; requires 5+ sessions in token log; `CTO_GHOST_SCAN_DISABLE=1` override
- `cto diff` — show token delta between current file and `.bak`; reports tokens before/after, % saved, and line delta; no-op with helpful message when no .bak exists
- `cto audit --fix` — auto-creates missing files for error/info-level check failures (CLAUDE.md, .claudeignore, 3 essential files, docs/INDEX.md); never overwrites existing files; re-audits after fixes
- `cto init` now shows auto-detection feedback: `Auto-detected: nextjs` or `No framework detected` before setup

### Changed

- Version: 2.2.0 → 2.3.0
- Hook count: 11 → 12 templates (UserPromptSubmit: 3 → 4)
- Test suite: 126 → 153 tests (added watch, diff, audit --fix, init auto-detect, hook script tests)

---

## [2.2.0] — 2026-05-20

### Added — Maintenance commands

- `cto audit` — CLAUDE.md health report: 8 structural checks, exits 1 on errors, `--json` for CI
- `cto compress` — deterministic CLAUDE.md minifier: collapses blank lines, shortens code fence labels, truncates long lists
- `cto prune` — stale content remover: finds completed-task sections, session notes, empty headings → archives to `.claude/` (never deletes)
- `cto init --hooks` — install all hook templates non-interactively at project setup time

### Added — Two new hooks (all 5 event types now covered)

| Hook | Event | Purpose |
|------|-------|---------|
| `pre-tool-bash-guard` | PreToolUse | Block `find /`, `cat node_modules/`, bare recursive grep; warn on broad patterns |
| `notification-token-display` | Notification | Show session token estimate on first notification; cached + daily marker |

### Added — Framework intelligence

- `detectFramework(dir)` — auto-detect framework from `package.json`, `requirements.txt`, `go.mod`, `composer.json`, `Gemfile`
- `cto init` uses auto-detection when `--framework` not specified
- Enriched `.claudeignore` patterns: Next.js (`*.snap`, `__snapshots__/`), Express (`*.min.js`), Django (`**/migrations/*.py`), Go (`*.pb.go`), Laravel (`*.lock`)

### Tests

- 117 tests across 10 suites (up from 38 at v2.1.0)
- New suites: audit, compress, prune, hook-scripts, frameworks

---

## [2.1.0] — 2026-05-20

### Added — npm CLI (`cto` binary)

- `cto init` — interactive setup with 13 framework templates
- `cto measure` — accurate token counts via `@anthropic-ai/tokenizer`
- Flags: `--framework`, `--yes`, `--force`
- CI workflow (Node 20 + 22 matrix), Trivy security scanning, Dependabot

### Added — Hooks ecosystem

9 Claude Code hook templates covering all 5 event types:

| Hook | Event | Purpose |
|------|-------|---------|
| `pre-tool-token-guard` | PreToolUse | Warn/block when auto-loaded files exceed token threshold |
| `pre-tool-read-guard` | PreToolUse | Block reads of lock files, minified JS, binaries, large files |
| `post-write-token-diff` | PostToolUse | Log per-file token cost of Write/Edit operations |
| `session-end-token-report` | PostToolUse | Append session token estimate to token-log.md |
| `user-prompt-inject-context` | UserPromptSubmit | Auto-inject matching docs/learnings/ files from prompt keywords |
| `user-prompt-inject-snapshot` | UserPromptSubmit | Inject previous session snapshot for warm restart |
| `user-prompt-validate-claude-md` | UserPromptSubmit | Validate CLAUDE.md structure once per session |
| `stop-session-snapshot` | Stop | Write session snapshot after each Claude turn |
| `stop-path-guard` | Stop | Exit 2 if assistant mentions file paths that don't exist |

### Added — Hook management CLI

```bash
cto hooks list                  # show available templates + install status
cto hooks install <name>        # install one hook
cto hooks install --all         # install all hooks at once
cto hooks remove <name>         # remove an installed hook
cto hooks status                # show installed hooks + last-modified times
cto hooks settings              # print settings.json block (pipe-safe JSON)
```

---

## [1.5.0] - 2025-11-11

### Added

- ✅ **FastAPI / Flask framework example** (`examples/fastapi.md`)
  - FastAPI routing and dependency injection
  - Pydantic v2 models and validators (`@field_validator`, `@model_validator`)
  - Async SQLAlchemy patterns
  - pytest fixtures with database cleanup
  - Top 5 FastAPI/Flask-specific mistakes

- ✅ **Go (Gin/chi) framework example** (`examples/go.md`)
  - Router setup and middleware chains
  - Handler patterns and error handling
  - Context and request lifecycle
  - Testing with testify
  - Top 5 Go web-specific mistakes

- ✅ **Spring Boot framework example** (`examples/spring-boot.md`)
  - Controller, service, and repository layers
  - JPA and database patterns
  - Spring Security basics
  - Testing with JUnit and Mockito
  - Top 5 Spring Boot-specific mistakes

- ✅ **Svelte / SvelteKit framework example** (`examples/svelte.md`)
  - SvelteKit routing and load functions
  - Reactive stores and state management
  - Form actions and progressive enhancement
  - SSR and CSR patterns
  - Top 5 Svelte-specific mistakes

### Changed

- 📚 Updated `examples/README.md` with 4 new frameworks
- 📚 Updated main `README.md` framework count to 13

### Metrics

- **Total frameworks supported**: 13 (Express, Next.js, Vue, Nuxt, Angular, Django, Rails, NestJS, Laravel, FastAPI/Flask, Go, Spring Boot, Svelte)
- **Token savings**: 83-87% across all frameworks
- **Coverage**: JavaScript, TypeScript, Python, Ruby, PHP, Go, Java ecosystems

---

## [1.4.0] - 2025-11-11

### Added

- ✅ **Nuxt.js framework example** (`examples/nuxtjs.md`)
  - Server-side rendering and data fetching (useFetch, useAsyncData)
  - File-based routing and dynamic routes
  - Auto-imports and composables
  - Server routes and API endpoints
  - useState and Pinia state management
  - Top 5 Nuxt-specific mistakes (SSR pitfalls, hydration issues)

### Changed

- 📚 Updated `examples/README.md` with Nuxt.js
- 📚 Updated main `README.md` framework count to 9
- 📊 Added token savings estimate (84%)

### Metrics

- **Total frameworks supported**: 9 (Express, Next.js, Vue, Nuxt, Angular, Django, Rails, NestJS, Laravel)
- **Token savings**: 83-87% across all frameworks
- **Coverage**: JavaScript, TypeScript, Python, Ruby, PHP ecosystems

---

## [1.3.0] - 2025-11-11

### Added

- ✅ **NestJS framework example** (`examples/nestjs.md`)
  - Module organization and dependency injection
  - Controllers, guards, interceptors, pipes
  - TypeORM and Prisma database patterns
  - Exception handling and validation (DTOs)
  - Jest testing (unit, integration, e2e)
  - Top 5 NestJS-specific mistakes

- ✅ **Laravel framework example** (`examples/laravel.md`)
  - Eloquent ORM and query optimization
  - Resource controllers and RESTful routes
  - API resources and transformations
  - Form requests and validation
  - PHPUnit/Pest testing patterns
  - Top 5 Laravel-specific mistakes

### Changed

- 📚 Updated `examples/README.md` with 2 new frameworks
- 📚 Updated main `README.md` framework table
- 📊 Added token savings estimates (83% for both)

### Metrics

- **Total frameworks supported**: 8 (Express, Next.js, Vue, Angular, Django, Rails, NestJS, Laravel)
- **Token savings**: 83-87% across all frameworks
- **Coverage**: JavaScript, TypeScript, Python, Ruby, PHP ecosystems

---

## [1.2.0] - 2025-11-11

### Added

- ✅ **Vue.js framework example** (`examples/vue.md`)
  - Composition API patterns (Vue 3+)
  - State management with Pinia
  - Vue Router patterns
  - Component communication best practices
  - Vitest testing patterns
  - Top 5 Vue-specific mistakes

- ✅ **Angular framework example** (`examples/angular.md`)
  - Standalone components (Angular 17+)
  - Signals and reactive state
  - Dependency injection patterns
  - RxJS and observables
  - NgRx state management
  - Top 5 Angular-specific mistakes

- ✅ **Django framework example** (`examples/django.md`)
  - Django ORM and QuerySet optimization
  - Class-based vs function-based views
  - Django REST Framework patterns
  - Forms and validation
  - pytest and unittest patterns
  - Top 5 Django-specific mistakes

- ✅ **Ruby on Rails framework example** (`examples/rails.md`)
  - ActiveRecord associations and queries
  - RESTful controller patterns
  - Hotwire (Turbo + Stimulus)
  - Background jobs with Sidekiq
  - RSpec testing patterns
  - Top 5 Rails-specific mistakes

### Changed

- 📚 Updated `examples/README.md` with 4 new frameworks
- 📚 Updated main `README.md` framework table
- 📊 Added token savings estimates for all frameworks (83-87% reduction)

### Metrics

- **Total frameworks supported**: 6 (Express, Next.js, Vue, Angular, Django, Rails)
- **Token savings**: 83-87% across all frameworks
- **Coverage**: JavaScript, TypeScript, Python, Ruby ecosystems

---

## [1.1.0] - 2025-11-11

### Added

- 🚀 **Bash initialization script** (`init.sh`)
  - Automated project setup in 2 minutes
  - Creates complete directory structure
  - Generates all essential files
  - Prompts for project information
  - Sets up .claudeignore automatically
  - Creates placeholder documentation
  - Zero-token system configured automatically

### Changed

- 📚 Updated README with two setup methods:
  - **Method 1**: Bash script (fastest, 2 minutes)
  - **Method 2**: Claude prompt (most customizable, 5 minutes)
- 📊 Added comparison table for setup methods
- ✨ Improved Quick Start section with curl command

### Features

- One-command setup: `curl -fsSL https://... | bash`
- Interactive prompts for project info
- Colored output for better UX
- Safety checks before setup
- Complete structure generation

---

## [1.0.0] - 2025-11-11

### Added

- 🎉 Initial release of Claude Token Optimizer
- ✅ Universal setup prompt for any project
- ✅ Express.js framework example with patterns
- ✅ Next.js framework example with patterns
- ✅ Completion docs template (zero-token system)
- ✅ Session file management template
- ✅ Documentation maintenance guide template
- ✅ Comprehensive README with badges and examples
- ✅ Quick start guide (5-minute setup)
- ✅ Contributing guidelines
- ✅ GitHub issue and PR templates
- ✅ MIT License

### Features

- 📉 **90% token savings** at session start (8,000 → 800 tokens)
- 📉 **88% overall reduction** (11,000 → 1,300 tokens)
- 📉 **100% savings** on historical context (0 tokens)
- 🔧 Selective loading system (load only what you need)
- 🔧 Zero-token historical context (completions/sessions/archive)
- 🔧 Topic-based learning files (~200-700 tokens each)
- 🔧 Framework-specific customization
- ⚡ 5-minute automated setup
- 📚 Copy-paste setup prompts

### Documentation

- Comprehensive README with:
  - Visual token savings comparison
  - Quick start guide
  - Usage examples (Express, Next.js)
  - Framework examples table
  - Collapsible FAQ section
  - Support and contribution links
- Examples directory:
  - Express.js patterns and mistakes
  - Next.js patterns and mistakes
  - Examples overview guide
- Templates directory:
  - Completion doc template
  - Maintenance guide template
  - Templates overview guide
- Contributing guide with:
  - Bug report guidelines
  - Feature request process
  - Framework example checklist
  - Code style guidelines

### Success Metrics

- **RedwoodJS Project** (source): 90% token savings
- **Express API** (estimated): 87% token savings
- **Next.js App** (estimated): 84% token savings

---

## How to Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Adding framework examples
- Reporting bugs
- Suggesting features
- Improving documentation

---

## Version History

- **2.3.7** (2026-05-20) - Latest — `cto init` .claudeignore includes README/CONTRIBUTING/GEMINI.md/AGENTS.md; 167 tests
- **2.3.6** (2026-05-20) - `cto measure` CTA fix for initialized projects; 165 tests
- **2.3.5** (2026-05-20) - project .claudeignore: README/CONTRIBUTING/GEMINI.md/AGENTS.md excluded; dev sessions now ~1,977 tokens
- **2.3.4** (2026-05-20) - CONTRIBUTING CLI setup; init.sh runtime deprecation; project .claudeignore optimized (91% token savings)
- **2.3.3** (2026-05-20) - 10 audit checks; 13 frameworks documented; `cto` consistency across hooks/README
- **2.3.2** (2026-05-20) - UX/docs polish; `cto` CTA consistency
- **2.3.0** (2026-05-20) - `cto watch`, `cto diff`, `cto audit --fix`, ghost-scanner hook, 12 hooks total
- **2.2.0** (2026-05-20) - `cto audit`, `cto compress`, `cto prune`; 117 tests; all 5 event types covered
- **2.1.0** (2026-05-20) - npm CLI (`cto`), 9 hook templates, `cto hooks` management
- **1.5.0** (2025-11-11) - FastAPI/Flask, Go, Spring Boot, Svelte framework examples (13 total)
- **1.4.0** (2025-11-11) - Nuxt.js framework example
- **1.0.0** (2025-11-11) - Initial release; Express/Next.js examples; zero-token documentation system

---

**Repository**: https://github.com/nadimtuhin/claude-token-optimizer
**License**: MIT
