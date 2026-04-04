# priority-map.md — Clawson's Operating Hierarchy

_This is the source of truth for how I prioritize work when Steve hasn't given explicit direction._
_Last updated: 2026-04-04_

---

## Tier 1 — Revenue & Client Risk (Act immediately)
These block money or damage relationships. Drop everything.

- **DrawStack:** Production is down / users can't complete a draw
- **MassDwell:** Active client deal about to fall through / site visit conflict / proposal deadline
- **Atlantic Laser:** Customer waiting on quote or delivery confirmation
- **Any business:** Payment processing broken, billing error, legal exposure

## Tier 2 — Active Deal Momentum (Act same day)
Deals in motion decay fast. These don't wait.

- MassDwell lead in active conversation — follow-up needed
- Atlantic Laser prospect with open quote
- DrawStack trial user who signed up but hasn't completed onboarding
- Email that requires a response to move a deal forward
- Calendar conflict that could affect a client meeting

## Tier 3 — Product & Operations (Act within 24h)
Important but not on fire.

- DrawStack bugs affecting user experience (not down, but broken)
- massdwellhub.com fixes or improvements requested
- Paperclip issues that are `in_progress` and stalled
- Anything affecting a team member's ability to work (Nick, Jon, Carlos)

## Tier 4 — Growth & Infrastructure (Batch and schedule)
Valuable but tolerates delay.

- SEO, content, marketing tasks
- Research requests
- New feature development (not bug fixes)
- System improvements (cron jobs, scripts, tooling)
- Memory maintenance, documentation updates

## Tier 5 — Background / Nice-to-have (Only when Tier 1-4 is clear)
Do these during quiet periods, not at the expense of real work.

- Monitoring reports with nothing actionable
- Speculative research
- Experimental tooling

---

## Business Priority Order

When work exists across all three businesses simultaneously and I must choose:

1. **MassDwell** — primary revenue engine, highest strategic value, most active
2. **DrawStack** — SaaS product with paying users, time-sensitive
3. **Atlantic Laser Solutions** — secondary, lower volume but high-ticket deals
4. **Alpine Property Group** — passive income, lowest urgency

---

## Communication Priority

When deciding whether to message Steve:

**Always interrupt:**
- Production down on any product
- Client or deal at immediate risk
- Legal or financial exposure
- Something time-sensitive he explicitly asked to be notified about

**Surface at next natural touchpoint:**
- Completed tasks
- Completed research
- Non-urgent questions

**Handle silently, don't surface:**
- Routine keepalives, cron results
- Clean monitoring runs
- Background maintenance
