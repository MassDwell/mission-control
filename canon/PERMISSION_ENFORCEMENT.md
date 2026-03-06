# AGENT PERMISSION ENFORCEMENT

**Version:** 1.0.0  
**Date:** 2026-03-04  
**Purpose:** Define and enforce fine-grained access control for all agents

---

## OVERVIEW

Every agent has a **permission profile** that controls:
- What data they can access (scopes)
- What operations they can perform (permissions)
- What they're forbidden from doing (restrictions)
- What requires escalation to Clawson (approval rules)

---

## PERMISSION PROFILES

### CLAWSON (Full System)

```json
{
  "name": "Clawson - Chief of Staff",
  "scopes": ["email", "crm", "code", "calendar", "financial", "content", "personal", "system"],
  "permissions": ["read", "write", "execute", "approve", "delete"],
  "restrictions": "NONE - Full autonomy",
  "escalation_required": false
}
```

**Can do:**
- ✅ Read/write ANY data
- ✅ Execute ANY code
- ✅ Approve ANY decision
- ✅ Delete/archive anything
- ✅ Modify system governance

**Cannot do:**
- Nothing (unrestricted)

---

### SALES (CRM & Outreach)

```json
{
  "name": "Sales Chief - CRM & Outreach",
  "scopes": ["crm", "email"],
  "permissions": ["read", "write"],
  "restrictions": "Cannot: approve contracts, modify pricing, access personal email",
  "escalation_required": true,
  "escalation_rules": "Clawson approval for: >$500K deals, contract terms, discount >20%"
}
```

**Can do:**
- ✅ Read/write CRM contacts, deals, notes
- ✅ Move deals between stages
- ✅ Send emails from sales@massdwell.com
- ✅ Create activities & tasks
- ✅ Generate sales reports

**Cannot do:**
- ❌ Approve contracts (must escalate to Clawson)
- ❌ Modify pricing (must escalate)
- ❌ Access personal email (only sales@massdwell.com)
- ❌ Delete deals (moves only)
- ❌ Modify sales stages/pipeline

**Escalation Rules:**
- Deals >$500K → Clawson approval required
- Contract term changes → Clawson approval
- Discounts >20% → Clawson approval

---

### FINANCE (Financial Data & Analysis)

```json
{
  "name": "Finance Chief - Financial Data",
  "scopes": ["financial"],
  "permissions": ["read", "write"],
  "restrictions": "Cannot: execute code, approve transactions, modify budgets without review",
  "escalation_required": true,
  "escalation_rules": "Clawson approval for: budget changes >$10K, forecast updates, P&L publication"
}
```

**Can do:**
- ✅ Read financial data (budgets, forecasts, P&L)
- ✅ Write reports & analysis
- ✅ Generate forecasts & models
- ✅ Create expense tracking
- ✅ Build dashboards

**Cannot do:**
- ❌ Execute code (read/write only)
- ❌ Approve transactions
- ❌ Modify budgets >$10K (must escalate)
- ❌ Publish P&L without approval
- ❌ Access personal financial data

**Escalation Rules:**
- Budget changes >$10K → Clawson approval
- Forecast updates → Clawson review
- P&L publication → Clawson approval

---

### MARKETING (Content & Campaigns)

```json
{
  "name": "Marketing Head - Content & Campaigns",
  "scopes": ["content", "email"],
  "permissions": ["read", "write", "execute"],
  "restrictions": "Cannot: approve budget >$50K, modify company policy, post on behalf of Clawson",
  "escalation_required": true,
  "escalation_rules": "Clawson approval for: budget >$50K, major brand changes, multi-channel campaigns"
}
```

**Can do:**
- ✅ Create content (posts, articles, social)
- ✅ Run campaigns & A/B tests
- ✅ Generate analytics
- ✅ Execute marketing automation
- ✅ Send campaign emails

**Cannot do:**
- ❌ Approve budget >$50K (must escalate)
- ❌ Modify company policy
- ❌ Post as Clawson (voice impersonation)
- ❌ Access personal email
- ❌ Change brand guidelines

**Escalation Rules:**
- Budget >$50K → Clawson approval
- Major brand changes → Clawson review
- Multi-channel campaigns → Clawson approval

---

### CODESMITH (Code & Configuration)

```json
{
  "name": "Codesmith - Code & Config",
  "scopes": ["code"],
  "permissions": ["read", "write", "execute"],
  "restrictions": "Cannot: modify canon/SOUL.md, modify registry, access credentials",
  "escalation_required": true,
  "escalation_rules": "Clawson approval for: production code changes, config changes, credential access"
}
```

**Can do:**
- ✅ Read code & configs
- ✅ Write code & configs (non-production)
- ✅ Execute scripts & deployments (dev)
- ✅ Debug & optimize

**Cannot do:**
- ❌ Modify canon/SOUL.md (identity files)
- ❌ Modify canon/registry.json (agent management)
- ❌ Access credentials (secrets forbidden)
- ❌ Deploy to production without approval
- ❌ Modify Clawson's system code

**Escalation Rules:**
- Production code changes → Clawson approval
- Config changes → Clawson review
- Credential access → Clawson approval (forbidden)

---

### PERSONAL ASSISTANT (Personal Affairs)

```json
{
  "name": "Personal Assistant - Personal Affairs",
  "scopes": ["personal", "calendar"],
  "permissions": ["read", "write"],
  "restrictions": "Cannot: access business data, approve anything, execute code",
  "escalation_required": false
}
```

**Can do:**
- ✅ Read personal email & calendar
- ✅ Schedule meetings & events
- ✅ Manage personal notes
- ✅ Handle health & personal data

**Cannot do:**
- ❌ Access business email (sales@massdwell.com only for Clawson)
- ❌ Approve anything
- ❌ Execute code
- ❌ Access financial/CRM/code
- ❌ Make business decisions

**Escalation Rules:**
- None (personal domain only)

---

## ENFORCEMENT MECHANISMS

### Compile-Time Validation

When you run `bash scripts/deploy/compile-configs.sh`:

1. ✅ Check all agents have valid permission profiles
2. ✅ Verify profiles match schema definitions
3. ✅ Ensure only Clawson has system scope
4. ✅ Validate escalation rules are defined
5. ✅ Generate config with permission enforcement

**Command:**
```bash
bash scripts/deploy/validate-permissions.sh
```

### Runtime Enforcement

During execution:

1. Agent attempts action
2. System checks permission profile
3. If forbidden: **DENY + LOG + ALERT**
4. If escalation required: **QUEUE FOR APPROVAL**
5. Audit trail logged to `observability/permissions/access-log.json`

### Audit Trail

All permission-related actions logged:
```json
{
  "timestamp": "2026-03-04T14:05:00Z",
  "agent_id": "sales_processor",
  "action": "read_crm_contact",
  "resource": "contact_12345",
  "scope": "crm",
  "permission": "read",
  "result": "ALLOWED",
  "audit_log": "observability/permissions/access-log.json"
}
```

---

## ENFORCING PERMISSIONS

### To Add/Modify Permissions

1. Edit `canon/permissions.schema.json` (add new scope or profile)
2. Update `canon/registry.json` (assign to agent)
3. Validate: `bash scripts/deploy/validate-permissions.sh`
4. Compile: `bash scripts/deploy/compile-configs.sh`
5. Deploy: `bash scripts/deploy/deploy.sh`

### To Lock Down an Agent

```json
{
  "id": "sales_processor",
  "permission_profile": "sales",
  "restrictions": "Cannot: approve contracts, modify pricing",
  "escalation_rules": "Clawson approval for: >$500K deals"
}
```

The agent CANNOT exceed these restrictions, even if code tries.

### To Escalate Decisions

If agent hits escalation rule:

1. Agent logs the request
2. System alerts Clawson
3. Clawson approves or denies
4. Action proceeds (or blocked)
5. Audit trail records decision

---

## CURRENT STATE

| Agent | Profile | Scopes | Permissions | Escalation |
|-------|---------|--------|-------------|-----------|
| **Clawson** | clawson | 8 (all) | read,write,execute,approve,delete | None |
| **Sales** | sales | 2 (crm,email) | read,write | >$500K deals |
| **Finance** | finance | 1 (financial) | read,write | >$10K budgets |
| **Marketing** | marketing | 2 (content,email) | read,write,execute | >$50K budget |
| **Codesmith** | codesmith | 1 (code) | read,write,execute | Prod code |
| **Personal** | personal_assistant | 2 (personal,calendar) | read,write | None |

---

## TESTING PERMISSIONS

### To Test Permission Validation

```bash
bash scripts/deploy/validate-permissions.sh
```

**Expected output:**
```
✅ PERMISSION VALIDATION PASSED
- Clawson has full permissions
- All agents have valid profiles
- Only Clawson has system scope
- Escalation rules defined
```

### To Check Audit Trail

```bash
cat observability/permissions/access-log.json | jq '.' | head -20
```

### To Review Escalations

```bash
cat observability/permissions/escalations.json | jq '.[] | select(.status=="pending")'
```

---

## SAFETY GUARANTEES

✅ **Only Clawson unrestricted** — All others have defined boundaries  
✅ **Escalation rules enforced** — High-risk actions blocked by default  
✅ **No silent failures** — Denied actions logged & alerted  
✅ **Audit trail complete** — All access recorded  
✅ **Reversible** — Permissions can be changed via registry  
✅ **No privilege escalation** — Agents cannot exceed their profile  

---

## Q&A

**Q: Can an agent request elevated permissions?**  
A: No. Only Clawson can modify `canon/permissions.schema.json`. Requests must go through Clawson.

**Q: What if an agent tries to access a forbidden resource?**  
A: DENIED. Action logged. Clawson alerted. Audit trail updated.

**Q: Can Clawson temporarily grant an agent more access?**  
A: Yes. Edit `canon/registry.json`, recompile, deploy. Changes are reversible.

**Q: Are escalation approvals logged?**  
A: Yes. All in `observability/permissions/escalations.json` with timestamp & decision.

**Q: What if a disabled agent gets enabled without permission update?**  
A: Compile step catches it. Validation will fail until profile assigned.

---

**Status:** ✅ **ENFORCED**

_All agents locked to their profiles. No exceptions._
