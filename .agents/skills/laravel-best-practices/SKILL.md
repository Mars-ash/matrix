---
name: laravel-best-practices
description: Laravel 13 conventions and best practices. Use when creating controllers, models, migrations, validation, services, or structuring Laravel applications. Triggers on tasks involving Laravel architecture, Eloquent, database, API development, or PHP patterns.
license: MIT
metadata:
  author: Laravel Community
  version: "2.1.0"
  laravelVersion: "13.x"
  phpVersion: "8.3+"
---

# Laravel 13 Best Practices

Comprehensive best practices guide for Laravel 13 applications. Contains 31 rules across 7 categories for building scalable, maintainable Laravel applications.

## When to Apply

Reference these guidelines when:
- Creating controllers, models, and services
- Writing migrations and database queries
- Implementing validation and form requests
- Building APIs with Laravel
- Structuring Laravel applications

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Architecture & Structure | CRITICAL | `arch-` |
| 2 | Eloquent & Database | CRITICAL | `eloquent-` |
| 3 | Controllers & Routing | HIGH | `controller-`, `ctrl-` |
| 4 | Validation & Requests | HIGH | `validation-`, `valid-` |
| 5 | Security | HIGH | `sec-` |
| 6 | Performance | MEDIUM | `perf-` |
| 7 | API Design | MEDIUM | `api-` |

## Quick Reference

### 1. Architecture & Structure (CRITICAL)

- `arch-service-classes` - Extract business logic to services
- `arch-action-classes` - Single-purpose action classes
- `arch-repository-pattern` - When to use repositories
- `arch-dto-pattern` - Data transfer objects
- `arch-value-objects` - Encapsulate domain concepts
- `arch-event-driven` - Decouple with events and listeners
- `arch-feature-folders` - Organize by domain/feature
- `arch-queue-routing` - Centralized job queue routing (Laravel 13+)
