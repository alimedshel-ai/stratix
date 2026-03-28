# Modernization Plan: Departmental Strategic Diagnostic Journey (15 Tools)

## Objective
Finalize the modernization of the 15-tool departmental strategic diagnostic journey to the premium dark-mode, glassmorphism-inspired UI pattern. Ensure consistent data persistence and phase-gated navigation.

## Status Overview

| Phase | Tool | File | Status | Note |
|---|---|---|---|---|
| **Diagnostic** | Deep Analysis | `dept-deep.html` | ✅ Modern | Integrated version. |
| | | `finance-deep.html` | ✅ Modern | Integrated into dept-deep. |
| | | `sales-deep.html` | ✅ Modern | Integrated into dept-deep. |
| | | `hr-deep.html` | ✅ Modern | Already modernized. |
| | Forensic Audit | `hr-audit.html` | ✅ Modern | HR version. |
| | | `finance-audit.html` | 🔴 Legacy? | Need to check. |
| | | `...-audit.html` | 🔴 Legacy | Other depts. |
| | PESTEL | `pestel.html` | ✅ Modern | Shared. |
| | Dept Health | `dept-health.html` | ✅ Modern | Shared. |
| | SWOT | `swot.html` | ✅ Modern | Needs "Smart Sync" button. |
| | TOWS Matrix | `tows.html` | ✅ Modern | Has "Smart Sync" button. |
| **Planning** | Scenarios | `scenarios.html` | ✅ Modern | Shared. |
| | Strategic Directions | `directions.html` | ✅ Modern | Shared. |
| | Objectives (BSC) | `objectives.html` | ✅ Modern | Shared. |
| **Execution** | OKRs | `okrs.html` | ✅ Modern | Shared. |
| | KPIs | `kpis.html` | 🔴 Legacy | Need to modernize. |
| | Initiatives | `initiatives.html` | ✅ Modern | Shared. |
| **Monitoring** | Performance Reviews | `reviews.html` | 🔴 Legacy | Need to modernize. |
| | Corrections | `corrections.html` | 🔴 Legacy | Need to modernize. |
| | Auto Reports | `auto-reports.html` | 🔴 Legacy | Need to modernize. |
| | Risk Map | `risk-map.html` | 🔴 Legacy | Need to modernize. |

## Implementation Steps

### 1. Modernize Diagnostic Tools
- [ ] `dept-deep.html` (Generic)
- [ ] `finance-deep.html`
- [ ] `sales-deep.html`
- [ ] `finance-audit.html`

### 2. Enhance Existing Tools
- [ ] Add "Smart Sync" button to `swot.html` to pull from PESTEL/Audit.

### 3. Modernize Execution & Monitoring Tools
- [ ] `kpis.html`
- [ ] `reviews.html`
- [ ] `corrections.html`
- [ ] `risk-map.html`
- [ ] `auto-reports.html`

## Design System Reference
- **Background**: `#0b0d12`
- **Cards**: `rgba(22, 27, 34, 0.7)` with blur.
- **Borders**: `rgba(255, 255, 255, 0.08)`
- **Primary Color**: `#818cf8` (Lavender/Indigo)
- **Glassmorphism**: `backdrop-filter: blur(12px);`
- **Typography**: Tajawal (Arabic) / Inter (Numbers)
