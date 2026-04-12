# Stratix 2.0 | Navigation & Redirect Logic Documentation

## Overview
This document outlines the redirection and access control logic in Stratix 2.0. The platform uses a centralized mechanism to ensure users are on the correct page based on their role, department, and journey progress.

## Core Components

### 1. `StateManager.js` (The Source of Truth)
- Unified interface for all state storage.
- Replaces scattered `localStorage` and `sessionStorage` direct access.
- **Key Flow**: 
  - User answers diagnostic -> `StateManager` updates payload.
  - User selects role -> `StateManager` updates `KEYS.USER`.
  - User finishes phase -> `StateManager` marks step done.

### 2. `PageGuard.js` (The Guard)
- Injected into every page to prevent unauthorized access.
- **Checks**:
  - **Role Guard**: Ensures `OWNER` doesn't see `DEPT_MANAGER` dashboards and vice versa.
  - **Phase Guard**: Prevents users from jumping to "Execution" phase before completing "Diagnosis" (min 50-80% completion).
  - **Entity Guard**: Ensures users only see their own company/department data.
- **Redirects**:
  - If Unauthorized -> `/login.html`
  - If Unfinished Phase -> Redirects back to the last incomplete step with an overlay explanation.
  - If Wrong Role -> Redirects to the appropriate dashboard for that role.

### 3. `Context-Manager.js`
- Handles the lower-level key building (e.g., `company_123_hr_swot`).
- Interacts with `StateManager` to provide domain-aware data retrieval.

## Primary Flow Redirects

| User Action | Current Page | Condition | Destination |
|-------------|--------------|-----------|-------------|
| Login Success | `login.html` | Role = OWNER | `ceo-dashboard.html` |
| Login Success | `login.html` | Role = DEPT_MANAGER | `dept-dashboard.html?dept=...` |
| Finish Basic Diag | `diagnostic-owner.html` | Success | `diagnostic-result.html` |
| Select Path | `diagnostic-result.html` | Path = Manager | `dept-smart.html?dept=strategy` |
| Expired Session | Any | `!user` | `login.html?session_expired=true` |

## Maintenance Rules
- **NEVER** use `window.location.href` manually for access control; use `PageGuard.PAGE_RULES`.
- **ALWAYS** use `StateManager.getUser()` to determine the current user's state.
- **REDIRECTS** mapping should be updated in `js/page-guard.js` under `PAGE_RULES`.
