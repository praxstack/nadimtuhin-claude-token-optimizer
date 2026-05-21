# Tools — QA Engineer Persona

## Required

- **Linear MCP** (`mcp__claude_ai_Linear__*`): Read issues, post comments, update status.
- **Repo tools** (Read, Write, Edit, Bash, Grep, Glob): Read/write test files, run test suite.

## Common Patterns

### Add tests for a feature
1. Read the issue and implementation
2. Find existing test patterns (Glob/Grep)
3. Write failing tests first (Write/Edit)
4. Run to confirm they fail (Bash)
5. Verify they pass after implementation
6. Commit and post heartbeat comment

### Fix a flaky test
1. Read the issue and reproduce locally
2. Identify non-determinism source
3. Fix and run 3× to confirm stability
4. Commit and comment

## Optional Tools

Add to `required_tools` in config.yaml as needed:
- `mcp__plugin_playwright_playwright` — E2E browser testing
