# Design System Strategy: High-End Sales & Operations

## 1. Overview & Creative North Star
**Creative North Star: "The Architectural Editorial"**
This design system moves beyond the utility of a standard internal tool to create a space that feels authoritative, deliberate, and premium. The "Architectural Editorial" concept treats data not as a series of rows and columns, but as a structured narrative. By leveraging the deep navy tones of the brand, we create a sense of executive permanence. We break the "template" feel through intentional asymmetry—using large-scale typography and expansive white space—ensuring that every data point has the breathing room of a high-end publication while maintaining the density required for operations.

---

## 2. Color & Surface Philosophy
The palette is rooted in the depth of `primary` (#011832) and the technical clarity of `surface` (#F8F9FF).

### The "No-Line" Rule
Traditional 1px borders are prohibited for sectioning. Structural boundaries must be defined solely through background color shifts or tonal transitions.
- Use `surface-container-low` (#EEF4FF) to define the main content stage.
- Use `surface-container-highest` (#D0E4FF) to pull a high-priority data module forward.
- Boundaries are felt through the transition of these planes, not drawn with lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
- **Layer 0 (Base):** `surface` (#F8F9FF)
- **Layer 1 (Main Stage):** `surface-container-lowest` (#FFFFFF) — This is where the core white-space clarity lives.
- **Layer 2 (Functional Modules):** `surface-container-low` (#EEF4FF) — Use this for nested cards or secondary sidebar elements.

### The "Glass & Gradient" Rule
To inject "visual soul," floating navigation elements or modal headers should utilize Glassmorphism. Use `surface_variant` (#D0E4FF) at 60% opacity with a `20px` backdrop-blur. 
Main CTAs should employ a subtle linear gradient: `primary` (#011832) to `primary_container` (#051C36) at 135 degrees, providing a soft metallic sheen that flat colors lack.

---

## 3. Typography
We utilize 'Inter' not just as a font, but as a structural element. The hierarchy is designed to guide the eye through dense operational data with editorial grace.

- **Display (Display-LG/MD):** Used for primary dashboard metrics. These should be set with -2% letter spacing to feel compact and "designed."
- **Headlines (Headline-SM):** Set in `on_background` (#051D31). These represent major section starts.
- **Body (Body-MD):** The workhorse for sales data. Always ensure a line-height of at least 1.5 to maintain readability amidst high data density.
- **Labels (Label-SM):** Use `secondary` (#49607F) for metadata and column headers. These are intentionally smaller to allow the data (Body) to stand out.

---

## 4. Elevation & Depth
Elevation is achieved through **Tonal Layering** and **Ambient Light Simulation**, never through heavy drop shadows.

### The Layering Principle
Stacking `surface-container` tiers creates natural lift. Place a `surface-container-lowest` (#FFFFFF) card on top of a `surface-container-low` (#EEF4FF) background. The delta in luminance provides all the separation required.

### Ambient Shadows
When a component must float (e.g., a dropdown or a high-priority modal), use an Ambient Shadow:
- **Color:** `on_surface` (#051D31) at 6% opacity.
- **Blur:** 24px - 40px.
- **Spread:** -4px.
This mimics natural light dispersion rather than a harsh digital offset.

### The "Ghost Border" Fallback
If accessibility requires a container boundary, use a "Ghost Border": `outline_variant` (#C4C6CE) at 15% opacity. It should be barely perceptible, serving as a suggestion of a boundary rather than a hard wall.

---

## 5. Components

### Buttons & Navigation
- **Primary:** Gradient from `primary` to `primary_container`. High-contrast white text. `xl` (0.75rem) roundedness.
- **Secondary:** Transparent background with a `Ghost Border` and `primary` text.
- **Active Navigation:** Use `secondary_container` (#C1D9FE) with a `surface-tint` indicator.

### Data Tables & Lists
- **No Dividers:** Vertical white space (Spacing 4: 1rem) must separate rows.
- **Alternating Planes:** Use a subtle shift to `surface-container-low` for every other row to maintain tracking without using lines.
- **Headers:** `Label-MD` in `secondary` color, all-caps with +5% letter spacing for an editorial look.

### Tabbed Cards & Accordions
- **Nesting:** Tab headers should sit flush with the card top. The active tab is defined by a shift to `surface-container-lowest` (pure white) against the card's `surface-container-low` body.
- **Accordions:** Do not use "plus/minus" icons. Use a subtle chevron that rotates 180 degrees, utilizing `accent` (#445970) for the icon color.

### Status Badges
- **Contextual Colors:** Use `secondary_fixed` (#D3E3FF) for "In Progress" and `error_container` (#FFDAD6) for "Urgent." Badges should have 0% stroke and use `Label-SM` typography.

---

## 6. Do's and Don'ts

### Do
- **Do** use `20` (5rem) spacing for major section margins to create an editorial "frame."
- **Do** use `surface-container` tiers to create hierarchy.
- **Do** leverage the logo’s geometric "M" shape as a subtle watermark or mask for background patterns in the sidebar.
- **Do** ensure all interactive states (hover/active) use a background shift of at least 10% luminance.

### Don't
- **Don't** use 1px solid black or grey borders (#000000 or #808080).
- **Don't** use default Inter tracking; tighten the display styles and widen the label styles.
- **Don't** use high-opacity drop shadows (anything above 10% alpha).
- **Don't** use "divider lines" between list items; use white space from the Spacing Scale (minimum `2` / 0.5rem).