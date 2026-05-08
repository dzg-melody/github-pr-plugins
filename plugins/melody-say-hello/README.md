# melody-say-hello

Hello-world placeholder plugin used to validate the cross-tool packaging skeleton for `github-pr-plugins`.

This plugin ships a single skill, `melody-say-hello`, which simply emits a greeting. Its purpose is to verify that the plugin loads correctly under both Claude Code and OpenAI Codex CLI before any real functionality is implemented.

## Contents

| Path                                | What it is                                               |
| ----------------------------------- | -------------------------------------------------------- |
| `.claude-plugin/plugin.json`        | Claude Code plugin manifest                              |
| `.codex-plugin/plugin.json`         | Codex CLI plugin manifest                                |
| `.mcp.json`                         | Shared MCP servers config (empty placeholder)            |
| `skills/melody-say-hello/SKILL.md`  | The greeting skill (shared schema across both CLIs)      |

## Invoking

After installing the plugin (see the repository root `README.md`):

- **Claude Code**: trigger the skill via the namespaced reference `melody-say-hello:melody-say-hello`.
- **Codex CLI**: invoke as a skill named `melody-say-hello`.
