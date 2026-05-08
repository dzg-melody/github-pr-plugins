---
name: melody-say-hello
description: Cross-tool hello-world skill — outputs a friendly greeting to verify that the plugin loads correctly in both Claude Code and OpenAI Codex CLI.
---

# melody-say-hello

A minimal demo skill used as a smoke test for the cross-tool plugin skeleton.

## Behavior

When the user explicitly invokes this skill, respond with exactly one line:

> Hello from melody! 🎵 — running on {{tool}}.

Replace `{{tool}}` with `Claude Code` or `Codex CLI` if the runtime is easy to detect; otherwise use `your AI CLI`.

## Why this exists

The skill itself does no real work. Its only job is to prove that:

1. The host CLI can discover this plugin from the marketplace.
2. The skill's `SKILL.md` frontmatter (`name`, `description`) is parsed correctly.
3. The plugin namespace is wired up so that the skill is invokable.
