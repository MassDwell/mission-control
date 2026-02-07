# MassDwell Portal Branding Spec

## Phase 1: Branding (Tonight/Tomorrow AM)

### Login Page
1. **Logo** — Replace generic "Portal" icon with MassDwell logo
   - Logo location: Google Drive > MassDwell > Branding (or use from website)
   - Fallback: Text "MassDwell" in brand font

2. **Background Image** — Replace stock architecture with MassDwell ADU photo
   - Use: Completed ADU exterior shot from lookbook
   - Or: Render of Dwell Classic model

3. **Colors** (apply in Softr Settings > Branding)
   - Primary: `#22c55e` (MassDwell green)
   - Background: `#0d0d0d` (dark)
   - Card background: `#1a1a1a`
   - Text: `#ffffff`
   - Secondary text: `#a0a0a0`

4. **Title** — Change "Portal" to "MassDwell Design Studio" or "Choose Your Finishes"

5. **Button** — Change black button to green (`#22c55e`)

### Softr Studio Steps
1. Open https://studio.softr.io
2. Click "MassDwell Design Portal"
3. Go to Settings > Branding
4. Upload logo, set colors
5. Edit Login page block
6. Replace background image
7. Update text/title
8. Publish

---

## Phase 2: Images (Tomorrow)

### Image Processing Script
Location: `scripts/process-portal-images.py` (to be created)

Tasks:
- Download all 132 images from Drive
- Crop to consistent 4:3 or 1:1 aspect ratio
- Center product in frame
- Resize to 800x600 or 600x600
- Re-upload to Drive with "_cropped" suffix
- Update Google Sheet with new URLs

### Label Naming Convention
Format: `[Category] - [Option Name] ([Type])`

Examples:
- "Kitchen Faucet - Chrome Pull-Down (Included)"
- "Cabinet Hardware - Matte Black Handles (Upgrade)"
- "Flooring - Oak Hardwood (Included)"

---

## Resources
- Softr login: sales@massdwell.com / MassDwell2026!
- Softr Studio: https://studio.softr.io
- Google Sheet: https://docs.google.com/spreadsheets/d/1UdidwqpYKo1ncru81LFdS5QHJCLfdg1-jv9poaD-IXw
- Image CSV: data/massdwell/finish-selections-images.csv
- Portal URL: https://portal.massdwell.com

---

## Acceptance Criteria
- [ ] MassDwell logo visible on login
- [ ] Brand colors applied throughout
- [ ] ADU image as background
- [ ] All finish options have clear labels
- [ ] Images properly cropped and consistent
- [ ] Mobile responsive
- [ ] Steve approved
