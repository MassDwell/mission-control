# DrawStack Blitz Merge Audit

**Date:** 2026-03-15
**Branches merged:** 6 (workflow, intelligence, collab, docs, ui, reliability)
**Build status:** CLEAN (TypeScript + lint pass, all 19 routes compiled)

---

## Feature Audit: Planned vs Built

### 🏗️ Core Draw Workflow

| Feature | Status | Notes |
|---------|--------|-------|
| Draw submission confirmation screen | ✅ Built | `submitSuccess` state in DrawDetail shows Draw #X submitted with amount, retainage, net breakdown |
| Draw checklist pre-submit | ✅ Built | `buildChecklist()` in DrawDetail validates line items, docs, budget before submit |
| Lender review flow — UNDER_REVIEW auto-transition | ✅ Built | GET /api/projects/[id]/draws/[drawId] auto-transitions SUBMITTED → UNDER_REVIEW when lender fetches |
| Draw approval confirmation — approved amount + retainage | ✅ Built | Approve button sends `approvedAmount`, displayed in summary cards |
| Funded status transition — lender marks APPROVED → FUNDED | ✅ Built | `handleFunded()` + PATCH route + `fundedAt` timestamp |
| Reject with reason | ✅ Built | `rejectReason` in state + sent in PATCH, stored in `rejectionReason` field |

---

### 📊 Project Intelligence

| Feature | Status | Notes |
|---------|--------|-------|
| Project overview page — SOV progress bars, billed to date, retainage | ✅ Built | ProjectTabs overview tab with stats cards (total budget, billed, retainage held, SOV lines) |
| Draw history timeline | ✅ Built | ProjectTabs draws tab lists all draws with status badges, amounts, dates |
| Budget health indicator — red/yellow/green | ✅ Built | Dashboard project cards show budget progress bar with color coding (green <50%, yellow <80%, red ≥80%) |
| Retainage ledger | 🔄 Partial | `retainageHeld` stat card shown in project overview, but no detailed ledger with total released/net |

---

### 👥 Multi-Party Collaboration

| Feature | Status | Notes |
|---------|--------|-------|
| Lender invite flow | ✅ Built | `lenderEmail` field in CreateProjectForm, POST /api/projects sends Resend email with invite link |
| Project access control | ✅ Built | GET /api/projects filters by `ProjectMember` for LENDER role, only accepted memberships shown |
| Lender dashboard | ✅ Built | `/dashboard/lender` page shows all draws pending review across assigned projects |
| Activity log | ✅ Built | `ActivityLog` component in DrawDetail shows step-by-step timeline (Created → Submitted → Under Review → Approved/Rejected → Funded) |

---

### 📄 Documents & Compliance

| Feature | Status | Notes |
|---------|--------|-------|
| Document upload on draw detail | ✅ Built | Documents section in DrawDetail with file upload, list with filename/size/date, delete, download |
| Document required gating | 🔄 Partial | Checklist warns if no docs attached but doesn't hard-block submission (warning only, not a hard fail) |
| G702 cover sheet in PDF | ✅ Built | `DrawPackagePDF` in lib/pdf/draw-package.tsx generates G702 cover page + G703 continuation sheet |

---

### 🎨 UI/UX

| Feature | Status | Notes |
|---------|--------|-------|
| Empty states everywhere | ✅ Built | DrawDetail G703 table empty state (no line items), dashboard empty state (no projects), DashboardProjectList search no-results state |
| Loading skeletons | ✅ Built | `loading.tsx` for dashboard with animated pulse skeletons for stats cards and project list |
| Toast notifications | ✅ Built | `react-hot-toast` used for save, submit, approve, reject, funded actions in DrawDetail |
| Mobile responsive pass | 🔄 Partial | DrawDetail header and summary grid use `sm:` breakpoints; breadcrumb and full page pass is partial (not all pages audited for 375px) |
| Breadcrumb navigation | ✅ Built | `Breadcrumb` component used on project detail and draw detail pages |
| Project cards on dashboard | ✅ Built | Rich project cards with draw count, budget % progress bar, status chip for last draw |

---

### 🐛 Bug Fixes & Polish

| Feature | Status | Notes |
|---------|--------|-------|
| PDF download — error handling + loading state | ✅ Built | `downloadingPdf` spinner, `pdfError` display, `toast.error` on failure |
| Form validation — inline errors | ✅ Built | CreateProjectForm has `inputError` class + field-level error messages; DrawDetail checklist inline errors |
| Number formatting — `$1,234.56` | ✅ Built | `formatCurrency` from lib/format used throughout DrawDetail, ProjectTabs, dashboard |
| Date formatting — consistent `Mar 15, 2026` | ✅ Built | `formatDate` from lib/format used in DrawDetail dates |
| Retainage % input on project creation | ✅ Built | Retainage % input in CreateProjectForm with default 10%, description text |

---

### 🚀 Performance & Reliability

| Feature | Status | Notes |
|---------|--------|-------|
| Paginate projects list | ❌ Missing | No pagination implemented; DashboardProjectList shows all projects (search filter exists but no pagination) |
| Optimistic UI updates | ✅ Built | `handleSave` in DrawDetail uses snapshot rollback on failure + `saveStatus` state for immediate UI feedback |
| Error boundaries | ✅ Built | `ErrorBoundary` component wraps dashboard project list and draw detail page |
| API error messages | ✅ Built | All API routes return structured `{ error: string }` JSON with meaningful messages; drawn through to UI via `toast.error` |

---

## Summary

| Area | Built | Partial | Missing |
|------|-------|---------|---------|
| Core Draw Workflow | 6 | 0 | 0 |
| Project Intelligence | 3 | 1 | 0 |
| Multi-Party Collaboration | 4 | 0 | 0 |
| Documents & Compliance | 2 | 1 | 0 |
| UI/UX | 5 | 1 | 0 |
| Bug Fixes & Polish | 5 | 0 | 0 |
| Performance & Reliability | 3 | 0 | 1 |
| **TOTAL** | **28** | **3** | **1** |

**Coverage: 28/32 fully built, 3 partial, 1 missing**

### Gaps to address post-blitz:
1. **Retainage ledger detail** — add total held, total released, net retainage breakdown to project overview
2. **Document hard-gating** — make document requirement a project setting that hard-blocks submission (currently soft warning only)
3. **Pagination** — add 20-per-page + load more to projects list
4. **Mobile responsive audit** — full 375px pass on all dashboard pages (project detail, SOV builder)
