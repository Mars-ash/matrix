---
name: cicd-pipeline
description: >-
  Generate and optimize CI/CD pipelines for GitLab CI and CircleCI. Use when a
  user asks to set up GitLab CI, create a CircleCI pipeline, build a CI pipeline
  for GitLab, automate deployments with CircleCI, add test automation to GitLab,
  or configure continuous integration on non-GitHub platforms. For GitHub Actions
  pipelines, use the github-actions skill instead.
license: Apache-2.0
compatibility: "Any project with Git version control"
metadata:
  author: terminal-skills
  version: "1.1.0"
  category: devops
  tags: ["cicd", "gitlab-ci", "circleci", "pipeline", "deployment"]
---

# CI/CD Pipeline (GitLab CI & CircleCI)

## Overview

Generate production-ready CI/CD pipeline configurations for automated testing, building, and deploying applications on GitLab CI and CircleCI. This skill creates well-structured workflows with proper caching, matrix testing, environment separation, and deployment strategies. For GitHub Actions pipelines, use the `github-actions` skill.

## Instructions

When a user asks to create or improve a CI/CD pipeline, follow these steps:

### Step 1: Analyze the project

Detect the project type and requirements:

```bash
# Determine language and framework
ls package.json pyproject.toml Gemfile go.mod Cargo.toml pom.xml build.gradle 2>/dev/null

# Check for existing CI config
ls .gitlab-ci.yml .circleci/config.yml 2>/dev/null

# Detect test commands
cat package.json | grep -A5 '"scripts"' 2>/dev/null
cat Makefile 2>/dev/null | grep -E "^test|^lint|^build"
```
