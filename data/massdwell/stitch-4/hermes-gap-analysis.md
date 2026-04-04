# MassDwell Hub — Stitch Design System Gap Analysis

**Date:** April 1, 2026  
**Scope:** Live Next.js implementation vs. Stitch-4 design system specs (DESIGN.md + HTML spec)  
**Status:** Multiple critical and moderate gaps identified

---

## Executive Summary

The current implementation is **partially aligned** with the Stitch design system, but **significant gaps exist** in three areas:

1. **Borders & Dividers** — Using 1px borders extensively when the "No-Line" rule prohibits them
2. **Surface Hierarchy** — Inconsistent use of surface-container tones; missing proper layering
3. **Typography** — Display/Label styles not matching the spec's editorial intent
4. **Interactive States & Glassmorphism** — Not implemented; missing the gradient + glass visual soul
5. **Spacing & Editorial Layout** — Using tight spacing when the spec calls for expansive 20px (5rem) margins

---

## 1. Borders & Dividers — CRITICAL ❌

### The Spec Says
> **The "No-Line" Rule:** Traditional 1px borders are prohibited for sectioning. Structural boundaries must be defined solely through background color shifts or tonal transitions.

### What We Found
- **Card component** uses `ring-1 ring-foreground/10` — a subtle 1px outline (VIOLATES spec)
- **CardFooter** has `border-t` — explicit 1px divider (VIOLATES spec)
- **Button outline variant** uses `border-border` (VIOLATES spec)
- **Input fields** likely have bordered states instead of tonal shifts

### Gap Impact
- The UI feels technical and "boxy" instead of the intended "architectural editorial" aesthetic
- Borders create visual noise that contradicts the white-space-first philosophy
- Loss of the designed premium, calm feel

### Fix Required
Replace all 1px borders with `surface-container` tonal shifts:
```css
/* Instead of: ring-1 ring-foreground/10 */
/* Use background color + no ring */
.card {
  background: var(--surface-container-lowest);
  /* The card's position on a --surface-container-low background creates the boundary */
}
```

---

## 2. Surface Hierarchy & Nesting — HIGH ❌

### The Spec Says
Three distinct layers must exist:
- **Layer 0 (Base):** `surface` (#F8F9FF) — page background
- **Layer 1 (Main Stage):** `surface-container-lowest` (#FFFFFF) — core white-space area
- **Layer 2 (Functional Modules):** `surface-container-low` (#EEF4FF) — nested cards/sidebars

Nesting creates depth purely through tonal shifts; no shadows.

### What We Found
- **AppShell background:** `bg-[#F8F9FF]` ✅ Correct
- **Header:** `from-[#EEF4FF] to-[#F8F9FF]` — gradient exists but serves no semantic nesting purpose
- **Card backgrounds:** Rely on `ring-1` ring instead of tonal nesting
- **Sidebar:** Correct deep navy but lacks tonal "float" effect
- **Missing:** No clear nesting of secondary modules on primary surfaces

### Gap Impact
- Visual hierarchy is unclear; users can't tell which elements are "in focus"
- The premium "architectural" feeling is lost because layering feels flat
- Accessibility: low-contrast rings are not robust enough for wayfinding

### Fix Required
Establish a clear nesting model:
```html
<!-- Layer 0: Page base -->
<div class="bg-surface"> <!-- #F8F9FF -->
  <!-- Layer 1: Main content area -->
  <div class="bg-surface-container-lowest"> <!-- #FFFFFF -->
    <!-- Layer 2: Cards/modules -->
    <div class="bg-surface-container-low"> <!-- #EEF4FF -->
      Content
    </div>
  </div>
</div>
```

---

## 3. Typography — HIGH ❌

### The Spec Says
- **Display (Display-LG/MD):** Primary dashboard metrics with -2% letter-spacing for "designed" feel
- **Headlines (Headline-SM):** `on_background` (#051D31), section starters
- **Body (Body-MD):** Workhorse for data, minimum 1.5 line-height
- **Labels (Label-SM):** `secondary` (#49607F), uppercase, wide letter-spacing for metadata

### What We Found

**Headers/Page Titles:**
- AppShell `h1` uses `text-lg font-bold` — no explicit Display or Headline style
- No `-2%` letter-spacing on display elements
- `#011832` (primary) used instead of `#051D31` (on_background)

**Body Text:**
- Dashboard page uses `text-xs` labels in many places — too aggressive a reduction
- Line-height not explicitly set to 1.5+ for dense data sections
- No clear distinction between metadata labels and body text

**Labels:**
- Many inputs use `text-[10px] font-bold uppercase tracking-widest text-[#49607F]` ✅ Correct intent
- But inconsistency: some buttons use plain text without label treatment

**Missing Editorial Intent:**
- No Display-LG titles for key metrics (e.g., ROI calculator, process steps)
- Typography doesn't guide the eye through data like an editorial publication would
- Dense lists (TOWNS in permits page) lack typographic breathing room

### Gap Impact
- The "Architectural Editorial" north star is not visually apparent
- Data-dense pages feel cluttered, not premium
- No typographic hierarchy signals information priority

### Fix Required
```tsx
/* Define Display, Headline, Body, Label as explicit utilities */
<h1 className="display-lg text-navy" style={{letterSpacing: '-0.02em'}}>
  Key Metric: $2,800/month
</h1>

<h2 className="headline-sm text-on-background">
  Process Steps
</h2>

<p className="body-md text-on-background" style={{lineHeight: 1.5}}>
  Dense operational text goes here...
</p>

<label className="label-sm text-secondary">
  FINANCING OPTION
</label>
```

---

## 4. Interactive States & Glassmorphism — MODERATE ❌

### The Spec Says
- **Primary CTAs:** Gradient from `primary` (#011832) to `primary_container` (#051C36) at 135°
- **Navigation Active State:** Use `secondary_container` (#C1D9FE) with `surface-tint` indicator
- **Floating Elements:** Glassmorphism — `surface_variant` (#D0E4FF) at 60% opacity with 20px backdrop-blur
- **Ambient Shadows (when needed):** `on_surface` (#051D31) at 6% opacity, 24-40px blur, -4px spread

### What We Found

**Buttons:**
- Primary buttons: `bg-primary text-primary-foreground` — solid navy, no gradient
- No gradient from `primary` to `primary_container`
- Missing the "soft metallic sheen" that distinguishes premium CTAs

**Navigation Active State:**
- Sidebar active: `bg-[#C1D9FE]` ✅ Correct color
- Missing `surface-tint` accent indicator (left border or underline)
- No visual "pop" that matches the spec's intent

**Floating/Modal Elements:**
- No Glassmorphism implemented anywhere
- No backdrop-blur effects on dropdowns or modals

**Shadows:**
- AppShell header uses `shadow-sm` — likely too strong (Tailwind default is ~10% opacity)
- Sidebar uses `shadow-2xl` — contradicts the "Ambient Light Simulation" principle

### Gap Impact
- Buttons don't feel premium or intentional
- Users miss visual feedback that CTAs are important
- Missing Glassmorphism removes the "visual soul" the spec explicitly asks for
- Shadows feel digital/harsh instead of natural/ambient

### Fix Required
```tsx
/* Primary button with gradient */
<button className="bg-gradient-to-135 from-primary to-primary-container text-white rounded-xl">
  Action
</button>

/* Navigation active state with accent */
<a className="bg-secondary-container border-l-4 border-surface-tint">
  Active Item
</a>

/* Floating element with glassmorphism */
<div className="bg-surface-variant/60 backdrop-blur-[20px]">
  Floating content
</div>

/* Ambient shadow */
<div style={{
  boxShadow: 'rgba(5, 29, 49, 0.06) 0px 24px 40px -4px'
}}>
  Elevated element
</div>
```

---

## 5. Spacing & Editorial Layout — MODERATE ❌

### The Spec Says
- **Major section margins:** `20` (5rem / 80px) for editorial "frame"
- **No dividers:** Vertical white space (Spacing 4: 1rem / 16px) separates rows
- **Expansive layout:** Large typography + white space = premium feel
- **Alternating row planes:** Subtle `surface-container-low` shifts for tracking without lines

### What We Found

**AppShell:**
- Main content padding: `p-6 lg:p-12` (24px / 48px)
- Should be closer to 80px for that editorial frame
- Header is cramped: `h-16` with `px-6` feels tight

**Data Tables/Lists:**
- Permits page has dense data tables with minimal row spacing
- TOWNS accordion items lack the recommended 1rem vertical separation
- No alternating background colors for row tracking

**Card Spacing:**
- Dashboard cards: `gap-4` (16px) between children — good baseline
- But card itself doesn't breathe; could use more external margin

**Typography Spacing:**
- No explicit line-height: 1.5 on body text in data sections
- Section headers not separated with 80px margins; feels crammed

### Gap Impact
- Pages feel operational/utilitarian instead of premium/editorial
- Dense data is hard to parse visually
- Loses the "calm authority" that large white space conveys

### Fix Required
```tsx
<main className="p-20"> {/* 80px padding for editorial frame */}
  <h1 className="display-lg mb-20">Section Title</h1> {/* 80px margin */}
  <div className="space-y-4"> {/* 16px between items */}
    {items.map(item => (
      <div key={item.id} className="py-4 hover:bg-surface-container-low">
        {/* Alternating plane on hover/subtle bg */}
      </div>
    ))}
  </div>
</main>
```

---

## 6. Missing Accordion/Tabs Styling — MODERATE ❌

### The Spec Says
- **Accordions:** Do NOT use "plus/minus" icons. Use rotating chevron with `accent` color (#445970)
- **Tabs:** Active tab shifts to `surface-container-lowest` (#FFFFFF) against the body's `surface-container-low` (#EEF4FF)

### What We Found
- Permits page uses Accordion component from shadcn
- Likely using default +/- icons instead of rotating chevron
- No explicit accent color (#445970) on the chevron
- Dashboard page has TabsList but styling is unclear from code

### Gap Impact
- Visual consistency with the design system is lost
- Users don't see the intentional icon choice (chevron vs. +/-)

### Fix Required
```tsx
<AccordionItem>
  <AccordionTrigger>
    {/* Replace +/- icon with rotating chevron in accent (#445970) */}
    <ChevronDown className="text-accent transform transition-transform" />
    Title
  </AccordionTrigger>
  <AccordionContent>Content</AccordionContent>
</AccordionItem>
```

---

## 7. Status Badges — LOW ❌

### The Spec Says
- **"In Progress":** `secondary_fixed` (#D3E3FF) background
- **"Urgent":** `error_container` (#FFDAD6) background
- 0% stroke, Label-SM typography

### What We Found
- Permits page uses color badges (Easy/Moderate/Complex)
- Currently using `bg-green-100` / `bg-amber-100` / `bg-red-100` — standard Tailwind
- Not using the Stitch palette (#D3E3FF, #FFDAD6)

### Gap Impact
- Inconsistent color language across the app
- Misses the refined, designed aesthetic

### Fix Required
Replace Tailwind default greens/ambers with Stitch tokens:
```tsx
<Badge className="bg-secondary-fixed text-secondary"> {/* #D3E3FF */}
  In Progress
</Badge>

<Badge className="bg-error-container text-on-error-container"> {/* #FFDAD6 */}
  Urgent
</Badge>
```

---

## 8. Logo & Watermark — NOT FOUND ⚠️

### The Spec Says
> **Do** leverage the logo's geometric "M" shape as a subtle watermark or mask for background patterns in the sidebar.

### What We Found
- Sidebar displays logo but no geometric watermark/mask pattern
- Sidebar background is flat #011832, no pattern

### Gap Impact
- Misses a distinctive brand detail that would elevate the design
- Sidebar feels generic instead of owning a strong visual identity

### Fix Required
Add SVG mask/pattern to sidebar background using the M logo shape.

---

## 9. Ghost Border Fallback — UNUSED ✅

### The Spec Says
> Use "Ghost Border" for accessibility fallbacks: `outline_variant` (#C4C6CE) at 15% opacity.

### What We Found
- Not currently used, which is fine since all borders should be removed
- If accessibility requires a container boundary, this is available

### Gap Impact
- None. Spec is being followed by omission (though borders should be replaced entirely).

---

## Priority Fixes (In Order)

| Priority | Issue | Impact | Effort |
|----------|-------|--------|--------|
| 🔴 CRITICAL | Remove all 1px borders; use tonal shifts | Restores "no-line" principle | Medium |
| 🔴 CRITICAL | Add gradient to primary buttons | Adds premium feel | Low |
| 🟡 HIGH | Establish proper surface hierarchy nesting | Improves visual clarity | Medium |
| 🟡 HIGH | Fix typography: Display/Headline/Body/Label utilities | Makes editorial intent visible | Medium |
| 🟡 HIGH | Increase spacing to 80px margins; expand layout | Conveys premium, calm authority | Low |
| 🟠 MODERATE | Add Glassmorphism to floating elements | Adds visual soul | Medium |
| 🟠 MODERATE | Replace shadows with ambient light simulation | Feels more natural | Low |
| 🟠 MODERATE | Fix accordion chevron + accent color | Visual consistency | Low |
| 🟠 MODERATE | Replace Tailwind badge colors with Stitch tokens | Design language alignment | Low |
| 🟢 LOW | Add logo watermark to sidebar | Brand distinctiveness | High |

---

## Conclusion

The implementation is **structurally sound** (routing, components, auth all working), but **aesthetically incomplete**. The "Architectural Editorial" north star is not visually apparent. 

**The good news:** Most gaps are fixable with CSS/Tailwind utility changes, not structural refactoring. The component architecture is clean and ready for design refinement.

**Key wins to prioritize:**
1. Remove borders → use `surface-container` tones
2. Add button gradients
3. Establish 80px section margins
4. Create Display/Headline/Body/Label type scales

Once these are done, the app will feel **designed** instead of **templated**.

---

**Reviewed by:** Hermes  
**Analysis Scope:** globals.css, app shell, components, sidebar, dashboard, permits pages
