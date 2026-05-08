# github-pr-plugins

A **cross-tool plugin marketplace** that targets both [Claude Code](https://docs.claude.com/en/docs/claude-code/) and the [OpenAI Codex CLI](https://github.com/openai/codex) from a single repository. Future support for IDE plugins is planned once the CLI side is stable.

> Status: **scaffolding only**. The repo currently ships a single placeholder plugin (`melody-say-hello`) used to verify that both CLIs can discover and load plugins from this repository. Real functionality will land in subsequent commits.

## Repository layout

```
.
├── .claude-plugin/
│   └── marketplace.json         # Claude Code marketplace index
├── .agents/
│   └── plugins/
│       └── marketplace.json     # Codex CLI marketplace index
├── plugins/
│   └── melody-say-hello/        # First placeholder plugin
│       ├── .claude-plugin/plugin.json
│       ├── .codex-plugin/plugin.json
│       ├── .mcp.json
│       ├── skills/melody-say-hello/SKILL.md
│       └── README.md
├── scripts/validate.mjs         # Local schema validator (also used in CI)
├── .github/workflows/validate.yml
├── README.md
├── LICENSE
└── .gitignore
```

The two `marketplace.json` files are kept in sync by hand — they describe the same plugin set in the two CLI-specific dialects. The per-plugin `plugin.json` files share a near-identical schema but live in different directories so each CLI can discover them.

The `skills/` directory and `.mcp.json` are 100% schema-compatible across both CLIs, so they live as a single source of truth inside each plugin.

## Installation

### Claude Code

```text
/plugin marketplace add DZG-MELODY/github-pr-plugins
/plugin install melody-say-hello@github-pr-plugins
```

After install, invoke the demo skill: `melody-say-hello:melody-say-hello`.

### OpenAI Codex CLI

```bash
codex plugin marketplace add DZG-MELODY/github-pr-plugins
# Enable the plugin if Codex prompts you, or set
#   [plugins.melody-say-hello]
#   enabled = true
# in ~/.codex/config.toml
```

After install, invoke the demo skill: `melody-say-hello`.

## Local development

Run the validator before opening a PR:

```bash
npm install --no-save ajv@^8 ajv-formats@^3 gray-matter@^4
node scripts/validate.mjs
```

The validator checks:

- Both `marketplace.json` files against minimal embedded schemas.
- Every plugin's Claude **and** Codex manifest.
- Every `SKILL.md` frontmatter (`name`, `description`, and that `name` matches the parent directory).
- That each marketplace entry's relative `source` path actually exists.

The same script runs in CI on every push and pull request (`.github/workflows/validate.yml`).

## Roadmap

- [x] Mono-repo skeleton with marketplace indices for both CLIs
- [x] Placeholder plugin `melody-say-hello`
- [x] Local + CI validation
- [ ] First real plugin: GitHub PR workflow helpers
- [ ] Codex agent (TOML) + Claude Code subagent (`agents/*.md`) double-write generator
- [ ] IDE bridge (VS Code / JetBrains) once a stable target API is chosen

## References

- Claude Code Plugins: <https://code.claude.com/docs/en/plugin-marketplaces>
- Anthropic official marketplace (layout reference): <https://github.com/anthropics/claude-plugins-official>
- Codex CLI Plugins: <https://developers.openai.com/codex/plugins>
- Codex Skills (shared schema): <https://developers.openai.com/codex/skills>
- Codex MCP: <https://developers.openai.com/codex/mcp>

## License

[MIT](./LICENSE)
