---
name: api-tester
description: >-
  Test REST and GraphQL API endpoints with structured assertions and reporting.
  Use when a user asks to test an API, hit an endpoint, check if an API works,
  validate a response, debug an API call, test authentication flows, or verify
  API contracts. Supports GET, POST, PUT, PATCH, DELETE with headers, body,
  auth, and response validation.
license: Apache-2.0
compatibility: "Requires curl or Python 3.9+ with requests library"
metadata:
  author: terminal-skills
  version: "1.0.0"
  category: development
  tags: ["api", "testing", "rest", "graphql", "http"]
---

# API Tester

## Overview

Test API endpoints by sending HTTP requests, validating responses, and reporting results. Supports REST and GraphQL APIs with authentication, custom headers, request bodies, and structured assertions on status codes, headers, and response payloads.

## Instructions

When a user asks you to test or debug an API endpoint, follow these steps:

### Step 1: Gather endpoint details

Determine from the user or codebase:
- **URL**: The full endpoint URL
- **Method**: GET, POST, PUT, PATCH, DELETE
- **Headers**: Content-Type, Authorization, custom headers
- **Body**: JSON payload, form data, or query parameters
- **Auth**: Bearer token, API key, basic auth
- **Expected response**: Status code, response shape, specific values

### Step 2: Send the request

**Using curl (preferred for quick tests):**

```bash
# GET request
curl -s -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.example.com/users?page=1"

# POST request with JSON
curl -s -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Jane", "email": "jane@example.com"}' \
  "https://api.example.com/users"
```
