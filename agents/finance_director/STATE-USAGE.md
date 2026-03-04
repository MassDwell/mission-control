# STATE-USAGE.md — Finance Director Operational State

This document explains how the Finance Director (CFO) agent uses the operational state structure.

---

## 📊 State Structure Overview

Finance Director maintains a JSON state with these top-level sections:

```json
{
  "schema_version": "1.0",
  "agent_id": "finance_director",
  "businesses": { ... },
  "personal": { ... },
  "trading": { ... },
  "consolidated": { ... },
  "forecasts": { ... },
  "capital_allocations": { ... },
  "investment_pipeline": { ... },
  "risks": { ... },
  "reports": { ... }
}
```

---

## 🏢 Businesses (Three Operating Companies)

**Purpose:** Track financial health of each business independently  
**Status:** Updated weekly with actuals, monthly with full metrics

### **MassDwell**

```json
"massdwell": {
  "latest_snapshot": {
    "revenue": 285000,
    "revenue_vs_forecast_pct": 8,
    "expenses": 180000,
    "profit_loss": 105000,
    "margin_pct": 36.8,
    "cash_position": 425000,
    "runway_months": 6
  },
  "ytd_revenue": 565000,
  "ytd_profit": 195000,
  "current_runway_months": 6,
  "capex_plan": [
    {
      "item": "Welding equipment upgrade",
      "amount": 50000,
      "timeline": "Q2 2026"
    }
  ]
}
```

**What to track:**
- Revenue (actual, vs. forecast %)
- Expenses (COGS + operating)
- Profit/Loss and margin %
- Cash position (bank balance)
- Runway (months of cash available)
- Capex plans (upcoming investments)

**When to update:**
- Weekly: Revenue actuals (from sales pipeline)
- Weekly: Cash position (bank balance)
- Monthly: Full financials (P&L, balance sheet)
- Quarterly: Capital plans, runway forecast

---

### **Atlantic Laser Solutions**

```json
"atlantic_laser": {
  "latest_snapshot": {
    "revenue": 48000,
    "revenue_vs_forecast_pct": -12,
    "expenses": 32000,
    "profit_loss": 16000,
    "margin_pct": 33.3,
    "cash_position": 87000,
    "runway_months": 8
  },
  "ytd_revenue": 96000,
  "ytd_profit": 28000,
  "current_runway_months": 8,
  "inventory_status": "optimal (45 days supply)"
}
```

**What to track:**
- Machine sales (units sold, average price, revenue)
- Gross margin per unit (should be ~50%+)
- Marketing spend and ROI
- Inventory value (machines in stock, consumables)
- Shipping costs (per machine, trends)
- Runway and cash position

**When to update:**
- Weekly: Machine sales (from sales records)
- Weekly: Cash position
- Monthly: Marketing ROI analysis
- Monthly: Inventory valuation

---

### **Alpine Property Group**

```json
"alpine": {
  "latest_snapshot": {
    "revenue": 127000,
    "revenue_vs_forecast_pct": 0,
    "expenses": 89000,
    "profit_loss": 38000,
    "margin_pct": 29.9,
    "cash_position": 1240000,
    "runway_months": 24
  },
  "ytd_revenue": 127000,
  "ytd_profit": 38000,
  "active_projects": [
    {
      "name": "11 Taft Hill Terrace",
      "budget": 750000,
      "spent": 425000,
      "irr": 0.18,
      "status": "development"
    }
  ],
  "capital_at_risk": 2100000
}
```

**What to track:**
- Project revenue (rental income, sale proceeds, refinance)
- Project expenses (development, management, maintenance)
- IRR per project (internal rate of return)
- Capital stack (equity vs. debt)
- Loan exposure (by project, interest rates, payoff schedules)
- Capital at risk (total deployed in projects)

**When to update:**
- Weekly: Cash position
- Monthly: Project budget vs. actual
- Monthly: Loan payment tracking
- Quarterly: Project IRR updates
- Quarterly: Capital deployment planning

---

## 💰 Personal Capital

**Purpose:** Track personal liquid assets and burn rate  
**Status:** Updated weekly

```json
"personal": {
  "liquid_cash": 450000,
  "investments": [
    {
      "type": "stocks",
      "value": 750000
    },
    {
      "type": "alternative",
      "value": 200000
    }
  ],
  "monthly_burn_rate": 35000,
  "runway_months": 13
}
```

**What to track:**
- Liquid cash (checking, savings, accessible accounts)
- Investments (stocks, bonds, alternative assets)
- Monthly personal spend (living expenses, personal projects)
- Runway (months until personal liquid depletes)

**Why it matters:**
- Personal cash isn't separate from business decisions
- If personal runway drops, may need to reduce distributions
- If businesses burn cash, personal reserves are cushion

**When to update:**
- Weekly: Cash position
- Monthly: Investment valuations
- Monthly: Personal burn rate
- Quarterly: Runway estimate

---

## 📈 Trading Portfolio (Read-Only)

**Purpose:** Visibility into MoneyPrinter trading desk  
**Status:** Read-only, updated daily

```json
"trading": {
  "portfolio_value": 127000,
  "ytd_pnl": 27000,
  "capital_at_risk": 100000,
  "read_only": true
}
```

**What to track:**
- Portfolio value (current market value)
- YTD P&L (profit/loss year-to-date)
- Capital at risk (deployed in active trades)
- But DO NOT attempt to manage or modify

**Why it matters:**
- Trading is capital that could be deployed elsewhere
- Need to know how much is "in use"
- But MoneyPrinter owns execution decisions

---

## 🔗 Consolidated View

**Purpose:** Single view of all capital and cash across all entities  
**Status:** Calculated daily from individual snapshots

```json
"consolidated": {
  "total_revenue_ytd": 788000,
  "total_expenses_ytd": 345000,
  "total_cash_position": 2182000,
  "total_runway_months": 12,
  "business_contributions": {
    "massdwell": {
      "revenue_pct": 71.7,
      "profit_pct": 56.5,
      "cash_pct": 19.5
    },
    "atlantic_laser": {
      "revenue_pct": 12.2,
      "profit_pct": 8.1,
      "cash_pct": 4.0
    },
    "alpine": {
      "revenue_pct": 16.1,
      "profit_pct": 11.0,
      "cash_pct": 56.8
    },
    "personal": {
      "cash_pct": 20.6
    }
  }
}
```

**How it's used:**
- Single runway estimate across all capital
- Identify which business is the profit driver
- See capital concentration (Alpine has most cash)
- Assess overall health vs. targets

---

## 🔮 Forecasts (Three Horizons)

### **Monthly (12-Month Rolling)**

```json
"monthly_12m": {
  "confidence_level": "high",
  "months": [
    {
      "month": "2026-03",
      "massdwell_revenue": 285000,
      "atlantic_laser_revenue": 48000,
      "alpine_revenue": 127000,
      "total_expenses": 320000,
      "total_cash_flow": 140000
    },
    ...
  ]
}
```

**Usage:**
- Plan monthly cash needs
- Identify cash crunch periods
- Match expenses to revenue cycles
- Update monthly (rolling basis)

### **Quarterly (4-Quarter Outlook)**

```json
"quarterly_4q": {
  "confidence_level": "high",
  "quarters": [
    {
      "quarter": "Q2 2026",
      "massdwell_revenue": 880000,
      "atlantic_laser_revenue": 145000,
      "alpine_revenue": 380000,
      "total_expenses": 960000,
      "total_ebitda": 445000
    },
    ...
  ]
}
```

**Usage:**
- Quarterly board-level planning
- Tax planning (estimate quarterly payments)
- Capital allocation decisions
- Update quarterly

### **Annual (Full Year)**

```json
"annual": {
  "confidence_level": "medium",
  "total_projected_revenue": 3200000,
  "total_projected_expenses": 1600000,
  "total_projected_profit": 1600000,
  "key_assumptions": [
    "MassDwell closes $300K average per project",
    "Atlantic Laser sells 8 machines/month at $6K margin",
    "Alpine realizes $127K/month income across portfolio"
  ]
}
```

**Usage:**
- Annual budget planning
- Set targets and KPIs
- Tax planning (estimate annual liability)
- Strategic capital decisions
- Update annually (with monthly refreshes)

---

## 💡 Capital Allocations

**Purpose:** Track where capital is deployed and pending  
**Status:** Updated when new decisions are made

### **Pending**

```json
"capital_allocations": {
  "pending": [
    {
      "opportunity": "MassDwell factory expansion",
      "amount": 150000,
      "expected_return": 0.25,
      "risk_profile": "medium",
      "timeline": "Q2 2026",
      "status": "awaiting_steve_approval"
    }
  ]
}
```

**When updated:** When new investment opportunity surfaces, Finance Director submits for Steve's approval.

### **Approved**

```json
  "approved": [
    {
      "opportunity": "Atlantic Laser inventory",
      "amount": 50000,
      "expected_return": 0.22,
      "approved_date": "2026-02-15",
      "deployment_timeline": "March 2026"
    }
  ]
}
```

**When updated:** Steve approves an allocation, move from pending to approved.

### **Deployed**

```json
  "deployed": [
    {
      "opportunity": "Alpine property acquisition",
      "amount": 500000,
      "deployed_date": "2026-02-01",
      "expected_irr": 0.18,
      "actual_irr": null
    }
  ]
}
```

**When updated:** Capital actually transferred, move from approved to deployed.

---

## 🎯 Investment Pipeline

**Purpose:** Track opportunities from screening to decision  
**Status:** Updated as opportunities flow through

```json
"investment_pipeline": {
  "screening": [
    {
      "opportunity": "Adjacent property acquisition",
      "amount": 200000,
      "initial_roi_estimate": 0.15,
      "reason": "Strong neighborhood fundamentals"
    }
  ],
  "under_analysis": [
    {
      "opportunity": "MassDwell production equipment",
      "amount": 80000,
      "analysis_status": "financing options review",
      "due_date": "2026-03-10"
    }
  ],
  "ready_for_decision": [
    {
      "opportunity": "Atlantic Laser equipment upgrade",
      "amount": 35000,
      "finance_rec": "approve",
      "expected_roi": 0.30,
      "submitted_to": "steve"
    }
  ],
  "approved": [...],
  "rejected": [...]
}
```

**Workflow:**
1. **Screening** → Initial filter (opportunity size, ROI estimate)
2. **Under Analysis** → Finance Director deep dives (due diligence, assumptions)
3. **Ready for Decision** → Finance recommendation submitted to Steve
4. **Approved** → Steve approves, moved from ready → approved
5. **Deployed** → Capital transferred

---

## ⚠️ Risks

**Purpose:** Track financial risks by severity  
**Status:** Updated weekly

```json
"risks": {
  "critical": [
    {
      "risk": "MassDwell Q2 project delays",
      "impact": "Revenue $200K delay",
      "probability": "medium",
      "mitigation": "Weekly status checks, identify bottlenecks"
    }
  ],
  "high": [
    {
      "risk": "Atlantic Laser market competition",
      "impact": "Margin pressure on machines",
      "probability": "medium",
      "mitigation": "Value-add service differentiation"
    }
  ],
  "medium": [
    {
      "risk": "Alpine refinance rates",
      "impact": "Loan cost increase $10K/year",
      "probability": "low",
      "mitigation": "Lock in rates when favorable"
    }
  ],
  "last_reviewed": "2026-03-04"
}
```

**Review cadence:**
- Daily: Any new critical risks?
- Weekly: Update high-level risks
- Monthly: Full risk assessment
- Quarterly: Strategic risk review with Steve

---

## 📋 Reports (The Five Key Deliverables)

### **1. Daily Flash (9 AM)**

```json
"daily_flash": {
  "date": "2026-03-04",
  "cash_position": 2182000,
  "urgent_issues": [
    "MassDwell vendor payment due 3/5 ($45K)",
    "Alpine loan payment on schedule"
  ],
  "highlights": [
    "Atlantic Laser sold 2 machines (revenue $12K)",
    "No cash shortage detected"
  ]
}
```

**Purpose:** Morning cash-position check  
**Format:** 1 page max  
**Recipient:** Steve (if urgent issues only)  
**Update:** Every morning

### **2. Weekly Update (Friday 4 PM)**

```json
"weekly_update": {
  "week_of": "2026-03-03",
  "actual_vs_forecast": {
    "massdwell": {
      "revenue": 285000,
      "forecast": 265000,
      "variance": 7.5
    },
    "atlantic_laser": {
      "revenue": 48000,
      "forecast": 55000,
      "variance": -12.7
    },
    "alpine": {
      "revenue": 127000,
      "forecast": 127000,
      "variance": 0
    }
  },
  "top_3_risks": [
    "Atlantic Laser sales down 13% vs. forecast",
    "MassDwell capex timing may slip Q2",
    "Personal cash burn normal but trending up"
  ],
  "runway_estimate_days": 365
}
```

**Purpose:** Mid-week performance review  
**Format:** 2 pages  
**Recipient:** Steve (summary option)  
**Update:** Every Friday at 4 PM

### **3. Monthly Snapshot (Last Business Day)**

```json
"monthly_snapshot": {
  "month_of": "2026-02",
  "all_businesses": {
    "massdwell": { ... },
    "atlantic_laser": { ... },
    "alpine": { ... }
  },
  "key_metrics": {
    "total_revenue": 460000,
    "total_profit": 167000,
    "margin_pct": 36.3,
    "runway_months": 12
  },
  "capital_recs": [
    "Approve Atlantic Laser inventory expansion ($50K)",
    "Hold on MassDwell capex pending revenue confirmation"
  ]
}
```

**Purpose:** Full month financial summary  
**Format:** 5-10 pages (detailed)  
**Recipient:** Steve (full report)  
**Update:** Last business day of month

### **4. Quarterly Review (End of Q)**

```json
"quarterly_review": {
  "quarter": "Q1 2026",
  "tax_estimate": 125000,
  "strategic_allocation": {
    "massdwell_capex": 150000,
    "atlantic_laser_inventory": 50000,
    "alpine_opportunity": 200000,
    "personal_reserve": 100000
  },
  "investment_opps": [
    {
      "name": "MassDwell capacity",
      "amount": 150000,
      "expected_return": 0.25
    }
  ]
}
```

**Purpose:** Strategic capital decisions + tax planning  
**Format:** 10+ pages (comprehensive)  
**Recipient:** Steve (full review)  
**Update:** End of each quarter

### **5. Annual Plan (Year-End)**

```json
"annual_plan": {
  "year": 2026,
  "budget": {
    "massdwell": { ... },
    "atlantic_laser": { ... },
    "alpine": { ... }
  },
  "projections": { ... },
  "capital_needs": 500000
}
```

**Purpose:** Full-year budget and plan  
**Format:** 15+ pages (strategic)  
**Recipient:** Steve (comprehensive)  
**Update:** December for following year

---

## 🔄 Update Cadence

**Daily (9 AM)**
- Cash position (all entities)
- Trading portfolio (read-only snapshot)
- Flag urgent issues (shortages, anomalies)

**Weekly (Friday 4 PM)**
- Business revenue actuals (from CRM, records)
- Update expenses estimate
- Runway calculation
- Top 3 risks
- Create weekly update for Steve

**Monthly (Last business day)**
- Complete business snapshot
- Full P&L for each entity
- Cash flow reconciliation
- Forecast updates (rolling 12-month)
- Capital allocation review
- Full monthly report to Steve

**Quarterly (End of Q)**
- Tax estimate + planning
- Strategic capital allocation plan
- Investment pipeline review
- Full quarterly review to Steve

**Annually (December)**
- Full-year audit of results
- Budget for next year
- 3-year financial plan
- Capital strategy

---

## ✨ Key Metrics to Update

**Always Track:**
- Revenue (actual, vs. forecast, trend)
- Expenses (actual, vs. forecast, trend)
- Profit/Loss (actual, margin %)
- Cash position (balance, inflows, outflows)
- Runway (months remaining at current burn)

**Business-Specific:**
- **MassDwell:** Unit cost, margin per unit, project revenue
- **Atlantic Laser:** Machines sold, margin per unit, inventory days
- **Alpine:** Project IRR, capital deployed, loan exposure

**Consolidated:**
- Total revenue, total profit, total cash, total runway
- Business contribution (which business drives profit?)

---

## 📌 State Initialization Template

Use this to start a new month:

```json
{
  "schema_version": "1.0",
  "agent_id": "finance_director",
  "date_updated": "2026-03-04T00:00:00Z",
  "businesses": {
    "massdwell": { "latest_snapshot": {}, "ytd_revenue": 0, ... },
    "atlantic_laser": { "latest_snapshot": {}, "ytd_revenue": 0, ... },
    "alpine": { "latest_snapshot": {}, "ytd_revenue": 0, ... }
  },
  "personal": { ... },
  "trading": { ... },
  "consolidated": { ... },
  "forecasts": { ... },
  "risks": { ... },
  "reports": { ... }
}
```

---

## 🎯 Success Metrics (For CFO Agent)

- **Forecast accuracy:** Monthly forecasts within 10% of actual
- **Risk detection:** No surprises; all material risks flagged 2+ weeks early
- **Cash visibility:** Always know runway to within +/- 1 week
- **Capital ROI:** Recommended deployments deliver expected returns
- **Decision quality:** Steve has clear data when making capital decisions
- **Report timeliness:** All reports delivered on schedule (daily, weekly, monthly, quarterly)

---

_Last Updated: 2026-03-04_
