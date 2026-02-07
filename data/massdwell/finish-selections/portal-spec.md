# MassDwell Finish Selection Portal - Technical Spec

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Customer       │      │    Airtable     │      │  Ops Dashboard  │
│  Portal (Softr) │ ───▶ │    Database     │ ◀─── │  (Airtable)     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## AIRTABLE BASE SCHEMA

### Table 1: Customers
| Field | Type | Notes |
|-------|------|-------|
| Customer ID | Autonumber | Primary key |
| Name | Single line text | Full name |
| Email | Email | Login email |
| Phone | Phone | Contact number |
| Project Address | Long text | ADU location |
| Model | Single select | Essential, Classic, Deluxe, Prime |
| Contract Date | Date | When contract signed |
| Status | Single select | In Progress, Selections Complete, In Production |
| Kommo Deal ID | Number | Link to CRM |
| Portal Link | Formula | Softr URL with customer filter |

### Table 2: Finish Categories
| Field | Type | Notes |
|-------|------|-------|
| Category ID | Autonumber | |
| Category Name | Single line text | e.g., "Roof Shingles" |
| Display Order | Number | Sort order in portal |
| Description | Long text | Help text for customer |
| Required | Checkbox | Must select before submitting |

### Table 3: Finish Options
| Field | Type | Notes |
|-------|------|-------|
| Option ID | Autonumber | |
| Category | Link to Finish Categories | |
| Option Name | Single line text | e.g., "Mission Brown" |
| Brand | Single line text | e.g., "GAF" |
| Color/Style | Single line text | Description |
| Image | Attachment | Photo of finish |
| Is Upgrade | Checkbox | Standard vs. upgrade |
| Upgrade Price | Currency | Additional cost if upgrade |
| Product Code | Single line text | Manufacturer SKU |
| In Stock | Checkbox | Availability |

### Table 4: Customer Selections
| Field | Type | Notes |
|-------|------|-------|
| Selection ID | Autonumber | |
| Customer | Link to Customers | |
| Category | Link to Finish Categories | |
| Selected Option | Link to Finish Options | |
| Selected Date | Date | When selection made |
| Locked | Checkbox | Can't change after production |
| Notes | Long text | Special requests |

### Table 5: Selection Summary (View)
| Field | Type | Notes |
|-------|------|-------|
| Customer | Link | |
| Total Selections | Rollup | Count of selections |
| Total Upgrades | Rollup | Sum of upgrade costs |
| Completion % | Formula | Selections / Required categories |
| Missing | Formula | List incomplete categories |

---

## SOFTR PORTAL STRUCTURE

### Pages

**1. Login Page**
- Email/password authentication
- Branded MassDwell header
- "Forgot password" link

**2. Dashboard (Home)**
- Welcome message with customer name
- Project summary (model, address, status)
- Progress bar (X of 15 categories selected)
- Quick links to incomplete sections
- "Submit Selections" button (when 100% complete)

**3. Selection Pages (One per category)**
- Category title + description
- Grid of options with images
- Current selection highlighted
- Upgrade badge with price
- Click to select → saves immediately
- "Back to Dashboard" nav

**Categories (in order):**
1. Roof Shingles (10 options)
2. Siding Type (2 options)
3. Siding Color (3 options)
4. Exterior Lighting (4 options - upgrades)
5. Interior Wall Color - Standard (4 options)
6. Interior Wall Color - Accent (4 options - upgrades)
7. Flooring (6 options)
8. Interior Doors (2 options)
9. Door Hardware (3 options)
10. Kitchen Cabinets (5 options)
11. Cabinet Hardware (3+ options)
12. Countertops (5 options)
13. Kitchen Sink (3 options)
14. Kitchen Faucet (3 options)
15. Backsplash Grout (3 options)
16. Bathroom Vanity (4 options)
17. Bathroom Faucet (6 options)

**4. Summary Page**
- All selections in one view
- Grouped by room (Exterior, Interior, Kitchen, Bathroom)
- Total upgrade cost
- Edit buttons to change selections
- Print/PDF button
- Final submit with confirmation

**5. Confirmation Page**
- "Selections Locked" message
- PDF download of spec sheet
- Contact info for questions
- Timeline next steps

---

## OPS DASHBOARD (Airtable Views)

### View 1: All Customers
- Kanban by Status (In Progress | Complete | In Production)
- Shows: Name, Model, Completion %, Last Updated

### View 2: Ready for Production
- Filter: Status = "Selections Complete"
- Shows: All fields needed for manufacturing
- Export to PDF/CSV button

### View 3: Individual Customer Detail
- Expanded record view
- All selections with images
- Notes and special requests
- Action buttons: Lock, Generate Spec Sheet

### View 4: Upgrade Summary
- Group by Customer
- Sum of upgrade costs
- For billing/invoicing

---

## IMPLEMENTATION STEPS

### Phase 1: Airtable Setup (Day 1)
1. Create base from schema above
2. Import all finish options from finish-options.md
3. Upload product images (need from suppliers or lookbook)
4. Set up views for ops team
5. Add 1-2 test customers

### Phase 2: Softr Portal (Days 2-3)
1. Create Softr account
2. Connect Airtable base
3. Build login + dashboard pages
4. Create selection pages for each category
5. Build summary + confirmation pages
6. Configure email notifications

### Phase 3: Testing (Day 4)
1. Internal walkthrough with ops team
2. Test customer flow end-to-end
3. Verify data syncs correctly
4. PDF export testing

### Phase 4: Launch (Day 5)
1. Create accounts for first 3 active customers
2. Send portal invites
3. Monitor for issues
4. Gather feedback

---

## COSTS

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Airtable | Plus | $20 |
| Softr | Business | $59 |
| **Total** | | **$79/mo** |

---

## INTEGRATION POINTS

### Kommo CRM
- Store Portal Link in Kommo deal
- Sync Status changes (Selections Complete → update deal stage)
- Via Zapier or Make.com

### Future: Auto-generate Spec Sheets
- Use Airtable Scripting or external service
- Pull all selections → format PDF → attach to customer record

---

_Spec Version: 1.0_
_Created: 2026-02-04_
