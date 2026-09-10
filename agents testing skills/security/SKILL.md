---
name: owasp-zap-mcp
description: >
  A comprehensive Model Context Protocol (MCP) server for integrating OWASP ZAP
  security scanning with AI-powered development workflows. Provides spider scans,
  active scans, vulnerability detection, risk-based alert filtering, and report
  generation. Use when the user asks to security-test a web application, scan for
  vulnerabilities, run OWASP checks, detect XSS/CSRF/injection flaws, or audit
  web application security.
license: MIT
metadata:
  author: ashmere
  version: "latest"
  source: https://github.com/ashmere/owasp-zap-mcp
---

# OWASP ZAP MCP Server — Security Testing Skill

A comprehensive Model Context Protocol (MCP) server for integrating OWASP ZAP security scanning with AI-powered development workflows.

> **Disclaimer**: This project is an independent implementation and is not officially associated with, endorsed by, or affiliated with the OWASP Foundation or the OWASP ZAP project.

## Features

- 🔒 **Security Scanning**: Spider scans, active scans, and vulnerability detection
- 🕷️ **Content Discovery**: Automated web application crawling and mapping
- 🎯 **Targeted Analysis**: Risk-based alert filtering and comprehensive reporting
- 📊 **Multiple Formats**: HTML, XML, and JSON report generation
- 🔄 **Session Management**: Clear and manage ZAP scanning sessions
- 🚀 **SSE Mode**: Server-Sent Events for modern AI integration
- 🤖 **AI Integration**: Native Cursor IDE and VS Code integration via MCP protocol
- 📁 **Organized Reports**: Automatic report organization by domain

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cursor IDE    │◄──►│ owasp_zap_mcp   │◄──►│   OWASP ZAP     │
│                 │    │                 │    │                 │
│ - MCP Client    │    │ - SSE Server    │    │ - REST API      │
│ - AI Assistant  │    │ - ZAP Tools     │    │ - Scanner       │
│ - Code Analysis │    │ - HTTP/3000     │    │ - Proxy/8080    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/ashmere/owasp-zap-mcp.git
cd owasp-zap-mcp
./scripts/dev-setup.sh
```

### 2. Start Services

```bash
# Start security scanning services (most common)
./scripts/start.sh

# Or choose specific type
./scripts/start.sh --type image        # Pre-built image (default)
./scripts/start.sh --type build        # Build from source
./scripts/start.sh --type dev          # Local development
./scripts/start.sh --type devcontainer # Container development
```

### 3. Verify Setup

```bash
# Test ZAP connectivity
curl http://localhost:8080/JSON/core/view/version/

# Test MCP server
curl http://localhost:3000/health
curl http://localhost:3000/status
```

### 4. Stop Services

```bash
./scripts/stop.sh
```

## Prerequisites

- Docker and Docker Compose
- Cursor IDE or VS Code (with MCP support)
- Python 3.12+ (for local development)

## IDE Configuration

### Cursor IDE

Pre-configured in `.cursor/mcp.json`:

```json
{
  "servers": {
    "owasp-zap-security": {
      "type": "http",
      "url": "http://localhost:3000/sse"
    }
  }
}
```

### VS Code

Pre-configured in `.vscode/mcp.json`:

```json
{
  "servers": {
    "owasp-zap-security": {
      "type": "http",
      "url": "http://localhost:3000/sse"
    }
  }
}
```

## Development Options

### For Security Engineers (Recommended)

Use pre-built images for immediate scanning capability:

```bash
./scripts/start.sh

# Services available at:
# - ZAP API: http://localhost:8080
# - ZAP Web UI: http://localhost:8090
# - MCP Server: http://localhost:3000
```

### Local Development (Fastest)

```bash
# Start ZAP only
./scripts/start.sh --type dev

# In another terminal, run MCP server locally
cd owasp_zap_mcp && python -m owasp_zap_mcp.main --sse
```

### Container Development

```bash
./scripts/start.sh --type devcontainer
docker exec -it owasp-zap-mcp-devcontainer bash
```

### Build Testing

```bash
./scripts/start.sh --type build
# or
./scripts/rebuild.sh --type build
```

## Scan Types

| Scan Type | Description | Use Case |
|-----------|-------------|----------|
| Spider Scan | Crawls the target application | Content discovery and URL mapping |
| Active Scan | Tests for vulnerabilities | Identifies XSS, SQLi, CSRF, etc. |
| Alert Filtering | Risk-based categorization | Prioritize remediation efforts |
| Report Generation | HTML/XML/JSON reports | Documentation and compliance |
