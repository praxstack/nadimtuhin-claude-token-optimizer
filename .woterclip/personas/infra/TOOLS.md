# Tools — Infra Engineer Persona

## Required

- **Linear MCP** (`mcp__claude_ai_Linear__*`): Read issues, post comments, update status.
- **Repo tools** (Read, Write, Edit, Bash, Grep, Glob): Read/modify CI configs, Dockerfiles, IaC.

## Common Patterns

### Update a CI workflow
1. Read the issue and existing workflow files
2. Edit `.github/workflows/` files
3. Validate YAML syntax (Bash — python3/yq)
4. Commit and post heartbeat comment

### Environment config change
1. Read the issue for required vars
2. Update config files (not secrets — those go via the Board)
3. Update documentation
4. Commit and comment

## Optional Tools

Add to `required_tools` in config.yaml as needed:
- `mcp__context7` — Documentation lookup for cloud provider APIs
