# STATE-USAGE.md — Marketing Head Operational State

This document explains how the Marketing Head agent uses the operational state structure.

---

## 📊 State Structure Overview

Marketing Head maintains a JSON state with these top-level sections:

```json
{
  "schema_version": "1.0",
  "agent_id": "marketing_head",
  "brands": { ... },
  "campaigns": [ ... ],
  "content_library": { ... },
  "funnel": { ... },
  "analytics": { ... },
  "content_pipeline": { ... },
  "approvals_queue": { ... },
  "weekly_report": { ... }
}
```

---

## 🏢 Brands (Configuration)

**Purpose:** Store brand positioning, audiences, and channels  
**Status:** Pre-configured, read-only reference

```json
"brands": {
  "massdwell": {
    "positioning": "Modern modular ADUs built faster and smarter",
    "audiences": ["homeowners", "small developers", "municipal housing planners"],
    "channels": ["website", "SEO", "Facebook", "Instagram", "YouTube", "email"]
  },
  "atlantic_laser": {
    "positioning": "Industrial laser welding solutions",
    "audiences": ["fabrication shops", "manufacturers", "industrial operators"],
    "channels": ["website", "LinkedIn", "YouTube", "email", "paid ads"]
  },
  "alpine": {
    "positioning": "Experienced real estate developer",
    "audiences": ["brokers", "investors", "property owners"],
    "channels": ["website", "LinkedIn", "email", "industry networks"]
  }
}
```

**How it's used:**
- Reference when creating campaigns (ensure brand-specific positioning)
- Validate audience targeting (is audience in this brand's list?)
- Confirm channel selection (is channel in this brand's list?)

---

## 📋 Campaigns

**Purpose:** Track all marketing campaigns across brands  
**Status:** Empty initially, grows with each campaign launched

```json
"campaigns": [
  {
    "id": "campaign_001",
    "brand": "massdwell",
    "name": "ADU Zoning Demand Gen",
    "goal": "Generate 50+ qualified leads",
    "target_audience": "Homeowners 40-65, $500K+ homes, Boston suburbs",
    "channels": ["Google Ads", "Facebook", "Email"],
    "budget_usd": 2000,
    "status": "active",
    "start_date": "2026-03-15",
    "end_date": "2026-04-15",
    "kpis": {
      "target_leads": 50,
      "actual_leads": 0,
      "cost_per_lead_target": 40,
      "cost_per_lead_actual": 0
    }
  }
]
```

**Updates:**
- When campaign launches: Add new campaign object
- Daily: Update `actual_leads` and `cost_per_lead_actual`
- Weekly: Update full KPIs for active campaigns
- When campaign ends: Set status to "completed" or "failed"

---

## 📚 Content Library

**Purpose:** Organize all content assets by type  
**Status:** Empty initially, grows as content is created

```json
"content_library": {
  "articles": [
    {
      "id": "article_001",
      "title": "ADU Zoning in Massachusetts: What You Need to Know",
      "brand": "massdwell",
      "status": "published",
      "url": "massdwell.com/blog/adu-zoning-ma",
      "views": 234,
      "conversions": 18
    }
  ],
  "videos": [ ... ],
  "social_posts": [ ... ],
  "case_studies": [ ... ],
  "landing_pages": [ ... ]
}
```

**Updates:**
- When content is created: Add to appropriate section
- When content is published: Set status to "published", add URL
- Daily: Update views, clicks, conversions
- Weekly: Rank by performance (update top_content in weekly_report)

---

## 📊 Funnel

**Purpose:** Track visitors and leads at each funnel stage  
**Status:** Updated daily/weekly

```json
"funnel": {
  "awareness": {
    "visitors": 1245
  },
  "interest": {
    "engaged_users": 187
  },
  "engagement": {
    "content_interactions": 89
  },
  "leads": {
    "count": 23
  },
  "mql": {
    "count": 7
  },
  "sql": {
    "count": 2
  }
}
```

**Interpretation:**
- Awareness: Cold traffic (GA4 pageviews)
- Interest: Engaged traffic (content reads, video watches)
- Engagement: Email signups, webinar attendees, form interactions
- Lead: Contact info captured, entered CRM
- MQL: Marketing Qualified (meets audience criteria + engaged with content)
- SQL: Sales Qualified (Sales Chief took over, booking meeting)

**Conversion metrics:**
- Awareness → Interest: `interested_users / visitors`
- Interest → Engagement: `content_interactions / engaged_users`
- Engagement → Lead: `leads / interactions`
- Lead → MQL: `mql / leads`
- MQL → SQL: `sql / mql`

---

## 📈 Analytics

**Purpose:** Track performance metrics for optimization  
**Status:** Updated weekly

```json
"analytics": {
  "leads_by_source": {
    "organic": 12,
    "paid": 8,
    "referral": 2,
    "partnership": 1
  },
  "cost_per_lead": {
    "organic": 0,
    "paid": 50,
    "referral": 0,
    "partnership": 0
  },
  "conversion_rates": {
    "awareness_to_interest": 0.15,
    "interest_to_engagement": 0.48,
    "engagement_to_lead": 0.26,
    "lead_to_mql": 0.30,
    "mql_to_sql": 0.35
  },
  "campaign_roi": {
    "campaign_001": 2.5,
    "campaign_002": 1.8
  }
}
```

**Usage:**
- Identify top-performing sources (focus budget there)
- Calculate CAC by source (organic = free, paid = $)
- Track funnel efficiency (which stage has lowest conversion?)
- Evaluate campaign profitability (ROI = revenue / spend)

---

## 📝 Content Pipeline

**Purpose:** Track content production workflow  
**Status:** Updated daily

```json
"content_pipeline": {
  "ideas": [
    {
      "title": "Laser Welding ROI Calculator",
      "brand": "atlantic_laser",
      "status": "idea",
      "owner": "marketing_head"
    }
  ],
  "in_production": [
    {
      "title": "ADU Zoning Guide",
      "brand": "massdwell",
      "status": "writing",
      "due_date": "2026-03-10"
    }
  ],
  "scheduled": [
    {
      "title": "Newton ADU Case Study",
      "brand": "massdwell",
      "publish_date": "2026-03-12",
      "channel": "website"
    }
  ],
  "published": [
    {
      "title": "ADU Zoning in Massachusetts",
      "brand": "massdwell",
      "publish_date": "2026-03-01",
      "views": 234
    }
  ]
}
```

**Workflow:**
1. Idea created → goes to `ideas`
2. Content starts being written → moves to `in_production`
3. Content is ready for publication → moves to `scheduled`
4. Content goes live → moves to `published` (add views/performance)

---

## ✅ Approvals Queue

**Purpose:** Track messages/campaigns awaiting approval  
**Status:** Updated when approval needed

```json
"approvals_queue": {
  "pending": [
    {
      "id": "approval_001",
      "type": "campaign_launch",
      "brand": "massdwell",
      "title": "ADU Zoning Demand Gen Campaign",
      "requested_by": "marketing_head",
      "requested_at": "2026-03-04T14:00:00Z",
      "expires_at": "2026-03-05T14:00:00Z"
    }
  ],
  "history": [
    {
      "id": "approval_001",
      "type": "campaign_launch",
      "status": "approved",
      "approved_by": "steve",
      "approved_at": "2026-03-04T14:30:00Z"
    }
  ]
}
```

**Usage:**
- When marketing head wants to launch campaign → add to pending
- When Steve approves → move from pending to history (status=approved)
- When Steve denies → move to history (status=rejected, include feedback)
- Expired approvals → auto-archive after 48 hours

---

## 📊 Weekly Report

**Purpose:** Summarize weekly performance and recommendations  
**Status:** Generated every Monday morning

```json
"weekly_report": {
  "week_of": "2026-03-03",
  "leads_generated": 23,
  "top_campaigns": [
    {
      "name": "ADU Zoning Demand Gen",
      "brand": "massdwell",
      "leads": 18,
      "cac": 44
    }
  ],
  "top_content": [
    {
      "title": "ADU Zoning in Massachusetts",
      "brand": "massdwell",
      "views": 234,
      "conversions": 18,
      "conversion_rate": 0.077
    }
  ],
  "recommendations": [
    "Organic traffic performing well — increase blog content",
    "Atlantic Laser CAC high — test new messaging",
    "Alpine broker outreach showing 12% open rate — expand list"
  ]
}
```

**Generation:**
- Pull all metrics for the week
- Rank campaigns by leads and CAC
- Rank content by views and conversions
- Identify 2-3 key recommendations
- Share with Steve every Monday @ 10 AM

---

## 🔄 State Update Cadence

**Daily:**
- Update analytics (leads by source, cost per lead)
- Update content pipeline (move items through workflow)
- Update active campaign performance

**Weekly:**
- Update funnel metrics (visitors, MQLs, SQLs)
- Generate weekly report
- Archive completed campaigns
- Plan next week's content

**Monthly:**
- Review brand performance
- Evaluate ROI per campaign
- Plan strategic changes

---

## 📝 Example: Daily State Update

**Morning (9 AM):**
1. Check emails for new leads
2. Update `analytics.leads_by_source` (add 3 new leads from Facebook ads)
3. Update campaign `actual_leads` (campaign_001: 45 leads now)
4. Update `content_library.articles[0].views` (234 → 267 views)

**Weekly (Monday 10 AM):**
1. Calculate funnel metrics
2. Rank top content by conversion
3. Calculate campaign ROI
4. Generate recommendations
5. Share weekly report with Steve

---

## ✨ Key Metrics to Track

**Demand Metrics:**
- Leads by source (organic, paid, referral, partnership)
- Cost per lead (paid channels only)
- Conversion by campaign

**Funnel Metrics:**
- Awareness → Interest → Engagement → Lead → MQL → SQL
- Conversion rate at each stage
- Average time in stage

**Content Metrics:**
- Views, clicks, conversions
- CTR (click-through rate)
- Conversion rate by piece
- ROI per asset

**Campaign Metrics:**
- Budget vs. spend
- Leads generated
- CAC (cost per acquisition)
- ROI (revenue / spend, if known)

---

## 📌 Status Template

Use this to initialize state for a new month:

```json
{
  "campaigns": [],
  "content_library": { "articles": [], "videos": [], "social_posts": [], "case_studies": [], "landing_pages": [] },
  "funnel": { "awareness": { "visitors": 0 }, "interest": { "engaged_users": 0 }, "engagement": { "content_interactions": 0 }, "leads": { "count": 0 }, "mql": { "count": 0 }, "sql": { "count": 0 } },
  "analytics": { "leads_by_source": {}, "cost_per_lead": {}, "conversion_rates": {}, "campaign_roi": {} },
  "content_pipeline": { "ideas": [], "in_production": [], "scheduled": [], "published": [] },
  "approvals_queue": { "pending": [], "history": [] },
  "weekly_report": { "week_of": null, "leads_generated": 0, "top_campaigns": [], "top_content": [], "recommendations": [] }
}
```

---

**See:** MARKETING-HEAD-SCHEMA.json for complete schema definition  
**See:** MARKETING-HEAD-SOP.md for operational procedures

---

_Last Updated: 2026-03-04_
