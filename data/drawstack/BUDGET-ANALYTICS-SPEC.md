# DrawStack — Budget vs. Actual & Analytics Tab Spec
_Created: 2026-03-18_

## Overview

Add a **"Analytics"** tab to each project page (alongside Draws, Invoices, Documents, etc.) giving the developer a real-time financial performance view. The SOV remains the source of truth for lender reporting; this tab is the developer's operational lens.

---

## Tab: Analytics (project-level)

### Sub-tabs / Sections

---

### 1. Budget Health (default view)

**Purpose:** SOV scheduled value vs. actual spend, per division/category.

**Data sources:**
- `SOVLine.amount` (scheduledValue / budget)
- `DrawLineItem.workCompletedThisPeriod + materialsStoredPresently` aggregated across APPROVED + FUNDED draws (actual drawn)
- `InvoiceLineItem.amount` where `Invoice.status = APPROVED` (actual invoiced)

**UI — table with columns:**
| Column | Source |
|--------|--------|
| Division / Category | `SOVLine.category` (grouped) |
| Budget | Sum of `SOVLine.amount` in group |
| Drawn to Date | Sum of approved `DrawLineItem.amountThisDraw` mapped to this SOV group |
| Invoiced to Date | Sum of approved `InvoiceLineItem.amount` via `sovLineId` |
| Variance | Budget − Invoiced (green if under, red if over) |
| % Complete | Drawn / Budget |

**Summary cards (top of section):**
- Total Budget (project.totalBudget)
- Total Drawn to Date
- Total Invoiced
- Remaining Budget
- % Complete (overall)
- Over/Under Budget flag

---

### 2. Burn Rate & Trending

**Purpose:** Show spend velocity and project financial trajectory.

**Data sources:**
- `Draw.fundedAt` + `Draw.approvedAmount` — funded draws over time
- `Invoice.invoiceDate` + `Invoice.totalAmount` — invoice volume over time
- `Project.startDate` + `Project.endDate` — project timeline

**Charts:**
1. **Cumulative Spend** (line chart) — invoiced amount cumulative by month vs. expected linear burn (budget / months)
2. **Monthly Burn Rate** (bar chart) — invoiced per month
3. **Projected Final Cost** — current burn rate × remaining timeline → flag if projected > budget

**Cards:**
- Avg monthly burn (last 3 months)
- Projected completion cost at current burn
- Months remaining (if endDate set)
- Burn rate trend (↑ accelerating / ↓ decelerating)

---

### 3. Draw Progress

**Purpose:** Snapshot of draw history and funding pipeline.

**Data sources:**
- `Draw` records for the project
- `Draw.requestedAmount`, `Draw.approvedAmount`, `Draw.fundedAt`, `Draw.status`

**UI:**
- Timeline/progress bar: Total contract value → total funded → total pending
- Table of draws with: Draw #, Status, Requested, Approved, Funded Date
- Retainage summary: total held (sum of retainage across funded draws) vs. released

---

### 4. Invoice Aging

**Purpose:** Track open invoices and vendor payment pipeline.

**Data sources:**
- `Invoice` where `status != APPROVED` (open invoices)
- `Invoice.invoiceDate`, `Invoice.vendorName`, `Invoice.totalAmount`

**UI — table:**
| Vendor | Invoice # | Invoice Date | Amount | Age (days) | Status |
|--------|-----------|-------------|--------|------------|--------|
| ...    | ...       | ...         | ...    | ...        | ...    |

- Color-code age: <30 days (green), 30-60 (yellow), >60 (red)
- Summary: total open invoice value, avg age

---

### 5. Cost Variance by SOV Line

**Purpose:** Line-by-line budget vs. actual drill-down.

**Data sources:**
- `SOVLine` for each line
- Aggregated `InvoiceLineItem.amount` per `sovLineId`

**UI — table with sorting/filtering:**
| Line # | Description | Budget | Invoiced | Variance | % Used |
|--------|-------------|--------|----------|----------|--------|
| ...    | ...         | ...    | ...      | ...      | ...    |

- Highlight lines >100% used (over budget) in red
- Highlight lines <10% used near project end (potential underspend) in yellow

---

## API Routes Needed

### GET `/api/projects/[projectId]/analytics`

Returns aggregated analytics payload:

```ts
{
  summary: {
    totalBudget: number,
    totalDrawn: number,
    totalInvoiced: number,
    remainingBudget: number,
    percentComplete: number,
    overBudget: boolean
  },
  budgetByCategory: Array<{
    category: string,
    budget: number,
    drawn: number,
    invoiced: number,
    variance: number,
    percentComplete: number
  }>,
  burnRate: {
    monthly: Array<{ month: string, amount: number }>,
    cumulative: Array<{ month: string, amount: number }>,
    avgLast3Months: number,
    projectedFinalCost: number | null
  },
  drawProgress: {
    draws: Array<{ drawNumber, status, requestedAmount, approvedAmount, fundedAt }>,
    totalFunded: number,
    totalPending: number,
    retainageHeld: number
  },
  invoiceAging: Array<{
    id, vendorName, invoiceNumber, invoiceDate, totalAmount, status, ageDays
  }>,
  sovVariance: Array<{
    lineNumber, description, category, budget, invoiced, variance, percentUsed
  }>
}
```

---

## Component Structure

```
app/projects/[projectId]/analytics/
  page.tsx                    ← Analytics tab page
  
components/analytics/
  AnalyticsSummaryCards.tsx   ← Top-level KPI cards
  BudgetByCategoryTable.tsx   ← Budget health table
  BurnRateChart.tsx           ← Recharts line + bar charts
  DrawProgressTimeline.tsx    ← Draw history + retainage
  InvoiceAgingTable.tsx       ← Open invoice aging
  SOVVarianceTable.tsx        ← Line-by-line variance
```

---

## Navigation

Add "Analytics" to the project tab navigation (alongside Draws, Invoices, Documents).

---

## Plan Tier Gate

- **Starter:** Show summary cards only (total budget/drawn/invoiced) — no charts, no tables
- **Builder/Trial:** Full access — all sub-tabs and charts
- **Scale:** Full access

Feature flag: `budgetAnalytics` (basic) — always true; `budgetAnalyticsAdvanced` — Builder+

---

## Implementation Notes

- Use **Recharts** for charts (already likely in the stack given burn rate chart was partially built)
- All aggregations server-side in the API route — keep client components lean
- No new DB tables needed — all data already exists in Draw, DrawLineItem, Invoice, InvoiceLineItem, SOVLine
- Retainage calculation: `Draw.approvedAmount × (project.retainagePct / 100)` for each FUNDED draw
- Monthly burn: group `Invoice.invoiceDate` by month, sum `totalAmount`

---

## Priority / Sequencing

1. API route + summary cards (MVP, 1 day)
2. Budget by category table + SOV variance (2 days)
3. Burn rate charts (1 day)
4. Draw progress + invoice aging (1 day)

**Total estimate: ~5 days for full feature**
