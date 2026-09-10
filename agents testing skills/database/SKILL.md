---
name: postgres-mcp
description: >
  Postgres MCP Pro provides configurable read/write access and performance
  analysis for AI agents. Features include database health checks, index
  tuning, explain plans, schema intelligence, and safe SQL execution.
  Use when the user asks to analyze database performance, optimize queries,
  tune indexes, check database health, or execute SQL through an MCP server.
license: MIT
metadata:
  author: CrystalDBA
  version: "latest"
  source: https://github.com/crystaldba/postgres-mcp
---

# Postgres MCP Pro — Database Testing Skill

A Postgres MCP server with index tuning, explain plans, health checks, and safe SQL execution.

## Overview

**Postgres MCP Pro** is an open source Model Context Protocol (MCP) server built to support you and your AI agents throughout the **entire development process** — from initial coding, through testing and deployment, and to production tuning and maintenance.

### Features

- 🔍 **Database Health** — analyze index health, connection utilization, buffer cache, vacuum health, sequence limits, replication lag, and more.
- ⚡ **Index Tuning** — explore thousands of possible indexes to find the best solution for your workload.
- 📈 **Query Plans** — validate and optimize performance by reviewing EXPLAIN plans and simulating the impact of hypothetical indexes.
- 🧠 **Schema Intelligence** — context-aware SQL generation based on detailed understanding of the database schema.
- 🛡️ **Safe SQL Execution** — configurable access control, including support for read-only mode and safe SQL parsing.

## Prerequisites

1. Access credentials for your database.
2. Docker *or* Python 3.12 or higher.

## Installation

### Option 1: Using Docker

```bash
docker pull crystaldba/postgres-mcp
```

### Option 2: Using Python

```bash
pipx install postgres-mcp
# or
uv pip install postgres-mcp
```

## Configuration (Claude Desktop)

### Docker

```json
{
  "mcpServers": {
    "postgres": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "DATABASE_URI",
        "crystaldba/postgres-mcp",
        "--access-mode=unrestricted"
      ],
      "env": {
        "DATABASE_URI": "postgresql://username:password@localhost:5432/dbname"
      }
    }
  }
}
```

### uvx

```json
{
  "mcpServers": {
    "postgres": {
      "command": "uvx",
      "args": ["postgres-mcp", "--access-mode=unrestricted"],
      "env": {
        "DATABASE_URI": "postgresql://username:password@localhost:5432/dbname"
      }
    }
  }
}
```

## Access Modes

- **Unrestricted Mode**: Full read/write access. Suitable for development environments.
- **Restricted Mode**: Read-only transactions with resource utilization constraints. Suitable for production.

Replace `--access-mode=unrestricted` with `--access-mode=restricted` for production.

## SSE Transport

```bash
docker run -p 8000:8000 \
  -e DATABASE_URI=postgresql://username:password@localhost:5432/dbname \
  crystaldba/postgres-mcp --access-mode=unrestricted --transport=sse
```

## Optional Extensions

For index tuning and performance analysis, install these PostgreSQL extensions:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS hypopg;
```

## MCP Server API — Tools

| Tool Name | Description |
|-----------|-------------|
| `list_schemas` | Lists all database schemas available. |
| `list_objects` | Lists database objects (tables, views, sequences, extensions) within a schema. |
| `get_object_details` | Provides info about a specific database object. |
| `execute_sql` | Executes SQL statements on the database. |
| `explain_query` | Gets the execution plan for a SQL query. Can simulate hypothetical indexes. |
| `get_top_queries` | Reports the slowest SQL queries based on `pg_stat_statements` data. |
| `analyze_workload_indexes` | Analyzes workload to recommend optimal indexes. |

## Usage Examples

- "Check the health of my database and identify any issues."
- "What are the slowest queries in my database? And how can I speed them up?"
- "Analyze my database workload and suggest indexes to improve performance."
- "Help me optimize this query: SELECT * FROM orders JOIN customers ON orders.customer_id = customers.id WHERE orders.created_at > '2023-01-01';"
