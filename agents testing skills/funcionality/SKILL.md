---
name: playwright-agent-cli
description: >
  Skills teach coding agents how to use playwright-cli effectively, providing
  structured reference documentation that agents can discover and use.
  Use when testing functionality of web applications with Playwright Agent CLI.
  Covers browser automation, navigation, interaction, keyboard & mouse,
  tabs, dialogs, network & storage, console & eval, screenshots & PDF,
  codegen, tracing, test debugging, video recording, sessions, and configuration.
license: Apache-2.0
metadata:
  author: Microsoft / Playwright
  version: "latest"
  source: https://playwright.dev/agent-cli/skills
---

# Playwright Agent CLI — Functionality Testing Skill

Skills teach coding agents how to use `playwright-cli` effectively, providing structured reference documentation that agents can discover and use.

## Installing Skills

```bash
playwright-cli install --skills                # Claude Code layout (default)
playwright-cli install --skills=agents         # .agents/skills layout
playwright-cli install --skills -g             # install into the home directory
```

The skill is copied to `.claude/skills/playwright-cli` (or `.agents/skills/playwright-cli`) in the current workspace. With `--global` (alias `-g`) it goes to `~/.claude/skills` or `~/.agents/skills` instead, making it available in every project.

## What Skills Provide

`SKILL.md` covers the command surface — core interactions, snapshots and refs, sessions, raw output, and the `open`/`attach` parameters — and links to detailed reference guides for specific tasks:

- **Running and Debugging Playwright tests** — run, debug and manage Playwright test suites
- **Request mocking** — intercept and mock network requests
- **Running Playwright code** — execute arbitrary Playwright scripts with `run-code`
- **Browser session management** — manage multiple browser sessions, attach and detach
- **Storage state (cookies, localStorage)** — persist and restore browser state
- **Test generation** — plan, generate and heal Playwright tests
- **Tracing** — record and inspect execution traces
- **Video recording** — capture browser session videos, including scripted hero videos
- **Inspecting element attributes** — get element attributes not visible in snapshots

## Skills-less Operation

You can use `playwright-cli` without installing skills. Point your agent at the CLI and let it discover commands:

```
Test the "add todo" flow on https://demo.playwright.dev/todomvc using playwright-cli.
Check playwright-cli --help for available commands.
```

## Supported Agents

Skills work with:
- Claude Code
- GitHub Copilot
- Cursor
- Any coding agent that supports locally installed skills

## Key Reference Links

| Topic | URL |
|-------|-----|
| Introduction | https://playwright.dev/agent-cli/introduction |
| Installation | https://playwright.dev/agent-cli/installation |
| Quick Start | https://playwright.dev/agent-cli/quick-start |
| Snapshots | https://playwright.dev/agent-cli/snapshots |
| Command Reference | https://playwright.dev/agent-cli/capabilities |
| Vision Mode | https://playwright.dev/agent-cli/vision-mode |
| Navigation | https://playwright.dev/agent-cli/commands/navigation |
| Interaction | https://playwright.dev/agent-cli/commands/interaction |
| Keyboard & Mouse | https://playwright.dev/agent-cli/commands/keyboard-mouse |
| Tabs | https://playwright.dev/agent-cli/commands/tabs |
| Dialogs | https://playwright.dev/agent-cli/commands/dialogs |
| Network & Mocking | https://playwright.dev/agent-cli/commands/network-routing |
| Storage & Auth | https://playwright.dev/agent-cli/commands/storage |
| Console & Eval | https://playwright.dev/agent-cli/commands/console-eval |
| Screenshots & PDF | https://playwright.dev/agent-cli/commands/screenshots-pdf |
| Codegen & Highlighting | https://playwright.dev/agent-cli/commands/codegen |
| Tracing | https://playwright.dev/agent-cli/commands/tracing |
| Test Debugging | https://playwright.dev/agent-cli/commands/test-debugging |
| Video Recording | https://playwright.dev/agent-cli/commands/video-recording |
| Sessions & Dashboard | https://playwright.dev/agent-cli/sessions |
| Attach & Detach | https://playwright.dev/agent-cli/commands/attach |
| Configuration | https://playwright.dev/agent-cli/configuration |
