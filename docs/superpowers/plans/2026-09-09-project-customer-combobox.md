# Customer Dropdown Combobox Implementation Plan (Strict Selection)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

Tambahkan searchable dropdown dengan strict selection pada field Customer saat membuat project baru di [ProjectCreateDialog](file:///c:/laragon/www/matrix/frontend/components/project-create-dialog.tsx). 

Customer **hanya boleh dipilih dari 78 daftar opsi resmi** (diurutkan A-Z) guna mencegah duplikasi atau ketidakkonsistenan penulisan nama PT. Fitur pencarian/ketik tetap tersedia untuk mempermudah user mencari dan memilih customer dari daftar.

## Scope & Customer Data

78 customer unik terurut alfabetis (A-Z) dari data yang diberikan.

## Tasks

### Task 1: Add DEFAULT_CUSTOMERS list to types.ts
- File: [frontend/lib/types.ts](file:///c:/laragon/www/matrix/frontend/lib/types.ts)
- Ekspor konstanta `DEFAULT_CUSTOMERS` dan type `DefaultCustomer`.

### Task 2: Create CustomerCombobox Component & Tests (TDD)
- File: [frontend/components/customer-combobox.tsx](file:///c:/laragon/www/matrix/frontend/components/customer-combobox.tsx)
- File: [frontend/components/customer-combobox.test.tsx](file:///c:/laragon/www/matrix/frontend/components/customer-combobox.test.tsx)
- Fitur:
  - Input teks untuk filter / cari opsi
  - Toggle chevron & clear button
  - List terurut A-Z
  - Hanya mengizinkan pemilihan dari opsi yang valid (strict)
  - Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
  - Click-outside detection

### Task 3: Integrate CustomerCombobox into ProjectCreateDialog
- File: [frontend/components/project-create-dialog.tsx](file:///c:/laragon/www/matrix/frontend/components/project-create-dialog.tsx)
- Ganti input biasa dengan `CustomerCombobox`.
- Validasi memastikan nilai customer yang dipilih valid dan ada di `DEFAULT_CUSTOMERS`.

### Task 4: Verification & Testing
- Vitest (`npm test`)
- TypeScript check (`npm run typecheck`)
- Browser UI flow check
