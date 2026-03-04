# Alpine Budget Tool - Implementation Checklist

**Base File:** `/Users/openclaw/.openclaw/workspace/agents/codesmith/alpine-cogs.html`  
**Estimated Time:** 15 minutes

---

## ✅ Pre-Flight Check

- [ ] Backup the original file: `cp alpine-cogs.html alpine-cogs.html.backup`
- [ ] Open file in editor
- [ ] Have audit report handy for reference

---

## 🎨 Task 1: Fix Color Scheme (5 min)

### Find & Replace in `:root` CSS variables (around line 19-32):

```css
/* FIND */
--alpine-blue: #2C5F8D;
--alpine-light-blue: #4A90C8;
--alpine-dark: #1A3A52;
--alpine-gray: #64748B;
--alpine-light-gray: #E2E8F0;
--alpine-bg: #F8FAFC;

/* REPLACE WITH */
--alpine-dark: #1A1A1A;          /* Black for headers/primary */
--alpine-medium: #2D3748;        /* Dark grey for text */
--alpine-gray: #64748B;          /* Keep - medium grey */
--alpine-light-gray: #E2E8F0;    /* Keep - light grey for borders */
--alpine-bg: #F8FAFC;            /* Keep - off-white background */
```

### Find gradient backgrounds and replace:

```css
/* FIND (around line 67) */
background: linear-gradient(135deg, var(--alpine-blue) 0%, var(--alpine-light-blue) 100%);

/* REPLACE WITH */
background: #1A1A1A;
color: white;
```

### Update button styles:

```css
/* FIND .btn-primary (around line 114) */
background: linear-gradient(135deg, var(--alpine-blue) 0%, var(--alpine-light-blue) 100%);

/* REPLACE WITH */
background: #1A1A1A;
```

### Update .section-header:

```css
/* FIND (around line 292) */
background: linear-gradient(135deg, var(--alpine-dark) 0%, var(--alpine-blue) 100%);

/* REPLACE WITH */
background: #1A1A1A;
```

### Search & destroy remaining blues:

```bash
# Use editor search (Cmd/Ctrl+F) for:
- "alpine-blue"
- "alpine-light-blue"
- "#2C5F8D"
- "#4A90C8"
- "1E40AF"
```

**Verification:**
- [ ] No blue colors remain in CSS
- [ ] All headers are black or dark grey
- [ ] Buttons are black
- [ ] Page loads without color issues

---

## 📊 Task 2: Add Percentage Defaults (10 min)

### Step 1: Add DEFAULTS constant (around line 950, after `<script>`):

```javascript
<script>
    // Budget percentage defaults
    const DEFAULTS = {
        hard_cost_contingency_pct: 0.07,          // 7%
        soft_cost_contingency_pct: 0.04,          // 4%
        developer_fee_default_pct: 0.04,          // 4%
        gc_fee_default_pct: 0.03,                 // 3%
        gc_general_conditions_default_pct: 0.06   // 6%
    };

    // Default line items template for ground-up condo construction
    const DEFAULT_LINE_ITEMS = {
```

### Step 2: Find the line item strings in DEFAULT_LINE_ITEMS.soft (around line 1110):

Look for these lines and verify they exist:
- 'Hard Cost Contingency (5-8%)'  → Update to '(7%)'
- 'Soft Cost Contingency (3-5%)'  → Update to '(4%)'
- 'Developer fee'                  → Keep as is
- 'General contractor fee'         → Keep as is
- 'Contractor overhead'            → Keep as is

### Step 3: Add 'GC General Conditions' if missing:

In the `soft:` array, in the "Developer Costs" section, add:
```javascript
'Developer fee',
'Developer overhead allocation',
'Corporate expenses',
'GC General Conditions',  // ADD THIS LINE
```

### Step 4: Update the line item initialization logic:

Find the function that creates line items (search for `createDefaultLineItems` or where items are initialized).

Around line 1190-1250, find where items are created with default values.

**Add this logic** after line items are created but before they're returned:

```javascript
// Auto-calculate percentage-based defaults
function createDefaultLineItems() {
    const items = [];
    const now = new Date().toISOString();
    
    // Create hard cost items
    DEFAULT_LINE_ITEMS.hard.forEach(name => {
        items.push({
            id: generateLineItemId(name),
            category: 'hard',
            name: name,
            estimated: 0,
            budgetPercent: 0,
            actual: 0,
            variance: 0,
            variancePct: 0,
            visible: true,
            lastUpdate: now,
            notes: ''
        });
    });

    // Create soft cost items
    DEFAULT_LINE_ITEMS.soft.forEach(name => {
        items.push({
            id: generateLineItemId(name),
            category: 'soft',
            name: name,
            estimated: 0,
            budgetPercent: 0,
            actual: 0,
            variance: 0,
            variancePct: 0,
            visible: true,
            lastUpdate: now,
            notes: ''
        });
    });

    // Calculate percentage-based items AFTER project totals are established
    // This needs to be called separately after user enters main costs
    return items;
}

// NEW FUNCTION: Calculate default percentages
function applyDefaultPercentages(items) {
    const hardCosts = items.filter(i => i.category === 'hard');
    const softCosts = items.filter(i => i.category === 'soft');
    
    const totalHardCosts = hardCosts.reduce((sum, i) => 
        sum + (i.name.includes('Contingency') ? 0 : i.estimated), 0);
    const totalSoftCosts = softCosts.reduce((sum, i) => 
        sum + (i.name.includes('Contingency') ? 0 : i.estimated), 0);
    const totalProjectCost = totalHardCosts + totalSoftCosts;

    items.forEach(item => {
        if (item.name.includes('Hard Cost Contingency')) {
            item.estimated = Math.round(totalHardCosts * DEFAULTS.hard_cost_contingency_pct);
        }
        else if (item.name.includes('Soft Cost Contingency')) {
            item.estimated = Math.round(totalSoftCosts * DEFAULTS.soft_cost_contingency_pct);
        }
        else if (item.name === 'Developer fee') {
            item.estimated = Math.round(totalProjectCost * DEFAULTS.developer_fee_default_pct);
        }
        else if (item.name === 'General contractor fee') {
            item.estimated = Math.round(totalHardCosts * DEFAULTS.gc_fee_default_pct);
        }
        else if (item.name === 'GC General Conditions') {
            item.estimated = Math.round(totalHardCosts * DEFAULTS.gc_general_conditions_default_pct);
        }
    });
    
    return items;
}
```

### Step 5: Add UI button to trigger calculation:

In the controls section (around line 760), add:
```html
<button class="btn btn-small btn-secondary" onclick="calculateDefaults()">
    🧮 Calculate Default Percentages
</button>
```

### Step 6: Add the calculateDefaults() function:

```javascript
function calculateDefaults() {
    const project = appData.projects.find(p => p.id === currentProjectId);
    if (!project) return;
    
    project.costs = applyDefaultPercentages(project.costs);
    saveData();
    showProjectDetail(currentProjectId);
    
    alert('Default percentages calculated:\n' +
          '• Hard Cost Contingency: 7%\n' +
          '• Soft Cost Contingency: 4%\n' +
          '• Developer Fee: 4%\n' +
          '• GC Fee: 3%\n' +
          '• GC General Conditions: 6%');
}
```

**Verification:**
- [ ] DEFAULTS constant is defined
- [ ] All 5 percentage defaults are present
- [ ] Line items exist for each percentage
- [ ] Calculate button appears in UI
- [ ] Clicking button calculates correct amounts

---

## 🧪 Task 3: Test Everything (5 min)

### Manual Tests:

1. **Load the page:**
   - [ ] Page loads without errors
   - [ ] Colors are black/white/grey (no blues)
   - [ ] All 208 line items visible

2. **Create a test project:**
   - [ ] Click "New Project"
   - [ ] Fill in details, click Create
   - [ ] Project appears in list

3. **Test line items:**
   - [ ] Click a project to open it
   - [ ] Count line items (should see 208 total)
   - [ ] Expand/collapse categories works
   - [ ] Click to edit a value (should work)
   - [ ] Add a note to an item (should work)

4. **Test percentage calculation:**
   - [ ] Enter some estimated costs for major items
   - [ ] Click "Calculate Default Percentages" button
   - [ ] Verify contingency/fee items update automatically
   - [ ] Check math: 7% of hard costs, 4% of soft costs, etc.

5. **Test other features:**
   - [ ] CSV export works
   - [ ] Add custom line item works
   - [ ] Delete item works (with confirmation)
   - [ ] Data persists on page reload (localStorage)

### Console Check:

Open browser console (F12), check for:
- [ ] No red errors
- [ ] localStorage has data: `localStorage.getItem('alpine-project-tracker')`

---

## 📋 Final Verification

- [ ] All CSS blues removed
- [ ] DEFAULTS constant defined with 5 percentages
- [ ] Calculate button exists and works
- [ ] All 208 items present (126 hard + 82 soft)
- [ ] Budget vs Actual tracking works
- [ ] Interactive features work (edit/add/delete)
- [ ] Auto-save works
- [ ] No console errors
- [ ] File saved and backed up

---

## 🚀 Deployment

Once verified:

1. **Move to production location:**
   ```bash
   cp alpine-cogs.html /Users/openclaw/.openclaw/workspace/alpine-property-tools/alpine-budget-tracker.html
   ```

2. **Update index/nav to point to new file**

3. **Archive old versions:**
   ```bash
   mkdir archive-2026-03-01
   mv alpine-budget.html archive-2026-03-01/
   # etc.
   ```

4. **Document:**
   - Update README with new file location
   - Add CHANGELOG entry
   - Commit to version control if applicable

---

## 📞 If Something Breaks

1. **Restore backup:** `cp alpine-cogs.html.backup alpine-cogs.html`
2. **Check console for errors**
3. **Review diff:** Compare your changes to backup
4. **Verify you didn't break JS syntax** (missing brackets, quotes, etc.)

---

**Questions?** Check the full audit report: `alpine-budget-audit-report.md`
