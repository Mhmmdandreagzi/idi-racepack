# STYLE.md

# RUN IDI RUN — Design System

## 1. Project Identity

**Project:** RUN IDI RUN  
**Organizer:** Ikatan Dokter Indonesia (IDI) Kabupaten Sumenep  
**Event:** Health-focused running event / community running event  
**Tagline:** "Langkah Sehat Untuk Negeri"

The visual identity combines running, health, medical professionalism, community, energy, and modern event experience.

The design must feel like a professional running event organized by a medical organization, not a generic hospital website.

## 2. Design Direction

Base the visual direction on the supplied RUN IDI RUN poster.

Core characteristics:

- Bold
- Energetic
- Sporty
- Medical
- Modern
- Clean
- Strong typography
- High contrast
- Warm background
- Professional but approachable

The UI should communicate:

> **HEALTH + RUNNING + PROFESSIONAL MEDICAL ORGANIZATION**

Avoid making the interface look like a hospital information system, generic SaaS dashboard, corporate banking application, or futuristic neon sports website.

## 3. Brand Personality

The visual personality should be:

- Healthy
- Active
- Energetic
- Trustworthy
- Human
- Professional
- Community-oriented
- Optimistic

The experience should feel energetic without becoming visually noisy.

# 4. Color Palette

Use the supplied poster as the primary visual reference.

### Primary Background — Warm Cream

```text
#F3E8D2
```

Use for main page backgrounds, large content areas, cards, empty space, and event sections.

Do not use pure white as the dominant background.

### Primary Black

```text
#111111
```

Use for main headings, strong typography, navigation text, important labels, icons, and dark sections.

### Primary Red

```text
#D71920
```

The main energetic accent.

Use for primary CTAs, active states, event highlights, important numbers, status indicators, and accent typography.

Do not make the entire interface red.

### Medical Green

```text
#26734D
```

Represents health, wellness, positive states, successful actions, and the medical identity.

Use for success states, health-related information, secondary CTAs, badges, and positive statistics.

### Light Medical Green

```text
#5C9B78
```

Use for softer supporting backgrounds, subtle badges, hover states, decorative elements, and charts.

### Gold / Yellow Accent

```text
#D4B84C
```

Use sparingly for achievement, race information, awards, special badges, and event highlights.

Do not use gold as the primary UI color.

### Supporting Neutral

```text
#E6D8BE
```

Use for borders, dividers, secondary surfaces, disabled backgrounds, and subtle UI elements.

## Color Hierarchy

Priority:

1. Cream
2. Black
3. Red
4. Medical Green
5. Gold
6. Supporting neutral

Typical composition:

```text
Cream background
        ↓
Black typography
        ↓
Red primary action
        ↓
Green health/success information
        ↓
Gold event highlight
```

# 5. Typography

Typography is one of the most important parts of the design.

The supplied poster uses an aggressive, hand-painted / brush-style display treatment for **RUN IDI RUN**. The website should reproduce that visual energy without sacrificing readability.

## Display Font

Preferred athletic display fonts:

- Anton
- Bebas Neue
- Oswald
- Archivo Black
- Barlow Condensed ExtraBold

Recommended primary display font:

```text
Anton
```

Use for hero titles, RUN IDI RUN branding, large numbers, event headings, and major statistics.

## Body Font

Recommended:

```text
Inter
```

Alternative:

```text
Manrope
```

Use for body text, forms, search, participant information, navigation, dashboard, tables, and buttons.

## Event Display Treatment

When displaying:

```text
RUN IDI RUN
```

use strong visual hierarchy.

Possible treatment:

```text
RUN       → black
IDI       → red
RUN       → black
```

A stacked treatment is also encouraged:

```text
RUN
IDI
RUN
```

The event typography should feel large, bold, tight, athletic, and high-impact.

Reserve decorative/brush typography for branding and major visual moments only.

# 6. Typography Scale

## Hero

```text
64–96px
font-weight: 900
line-height: 0.9–1
letter-spacing: -0.04em
```

Responsive:

```text
Mobile: 48–64px
Tablet: 64–80px
Desktop: 80–120px
```

## Page Heading

```text
36–48px
font-weight: 900
```

## Section Heading

```text
28–36px
font-weight: 800
```

## Card Heading

```text
20–24px
font-weight: 800
```

## Body

```text
14–16px
font-weight: 400–500
```

## Small Labels

```text
11–13px
font-weight: 700
text-transform: uppercase
letter-spacing: 0.08em
```

# 7. Layout

Use a modern editorial event layout.

Avoid excessive centered content.

Use strong horizontal sections and asymmetric compositions inspired by the poster.

Recommended structure:

```text
┌─────────────────────────────────────┐
│ NAVIGATION                          │
├─────────────────────────────────────┤
│                                     │
│ RUN                                 │
│ IDI                                 │
│ RUN                    EVENT VISUAL │
│                                     │
│ Langkah Sehat Untuk Negeri          │
│                                     │
├─────────────────────────────────────┤
│ EVENT INFORMATION                   │
├─────────────────────────────────────┤
│ CATEGORIES                          │
├─────────────────────────────────────┤
│ RACEPACK PICKUP                     │
├─────────────────────────────────────┤
│ FOOTER                              │
└─────────────────────────────────────┘
```

Use whitespace intentionally. The layout should feel editorial and athletic rather than like a conventional admin template.

# 8. Shapes

Use slightly rounded shapes, but avoid overly rounded SaaS-style interfaces.

Preferred:

```text
border-radius: 8px
```

to:

```text
border-radius: 24px
```

Cards should feel like event materials, not generic startup UI.

Use rectangular cards, strong borders, slight rounding, large typography, bold badges, and clear hierarchy.

# 9. Borders and Shadows

Use subtle dark or neutral borders.

Example:

```text
border: 1px solid #D8CDB8
```

For important elements:

```text
border: 2px solid #111111
```

Avoid excessive shadows.

The visual language should rely more on contrast, typography, borders, and color blocks than large drop shadows.

# 10. Buttons

Buttons must feel energetic.

## Primary Button

```text
background: #D71920
color: #FFFFFF
```

Examples:

```text
CARI PESERTA
AMBIL RACEPACK
```

Characteristics:

- Bold typography
- High contrast
- Medium corner radius
- Strong hover state
- Large touch target

## Success Button / State

```text
background: #26734D
color: #FFFFFF
```

Example:

```text
✓ RACEPACK SUDAH DIAMBIL
```

## Secondary Button

```text
background: transparent
border: 2px solid #111111
color: #111111
```

# 11. Racepack Pickup Interface

This is the most important application screen.

Priorities:

1. Speed
2. Clarity
3. Large typography
4. Easy touch interaction
5. Minimal distractions

Example:

```text
┌─────────────────────────────────────┐
│ RUN IDI RUN                         │
│                                     │
│ CARI PESERTA                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Nama / BIB                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ BUDI SANTOSO                        │
│ BIB 40001                           │
│ 10K                                 │
│                                     │
│ [ AMBIL RACEPACK ]                  │
└─────────────────────────────────────┘
```

The search field must be visually prominent.

The pickup screen must avoid unnecessary navigation.

# 12. Participant Status

## Belum Diambil

Use neutral/warning treatment.

```text
⚠ BELUM DIAMBIL
```

Use dark text, gold/neutral badge, and a clear border.

## Sudah Diambil

Use medical green.

```text
✓ SUDAH DIAMBIL
```

Use:

```text
#26734D
```

## Processing

Use a red or neutral animated indicator:

```text
MEMPROSES...
```

Do not use excessive animations.

# 13. Dashboard

Dashboard should maintain the event visual identity.

Use oversized numbers and strong typographic hierarchy.

Example:

```text
┌────────────────────────────────────┐
│ TOTAL PESERTA                      │
│ 1,166                              │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ SUDAH DIAMBIL                      │
│ 723                                │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ BELUM DIAMBIL                      │
│ 443                                │
└────────────────────────────────────┘
```

The dashboard should feel like an event command center.

Avoid generic blue/gray analytics dashboard styling.

# 14. Medical Identity

The medical theme must be subtle and professional.

Use visual cues such as:

- Running silhouette
- Medical cross
- Heart pulse
- Stethoscope-inspired line graphics
- ECG-inspired decorative lines
- Health icons
- Human movement
- Community
- Wellness

Do not fill the interface with medical icons.

The main identity remains:

```text
RUNNING EVENT
+
HEALTH
+
IDI
```

not:

```text
HOSPITAL INFORMATION SYSTEM
```

# 15. IDI Identity

The event is organized by:

**Ikatan Dokter Indonesia (IDI) Kabupaten Sumenep**

The UI should communicate institutional credibility.

Use:

```text
RUN IDI RUN
Ikatan Dokter Indonesia
Kabupaten Sumenep
```

The organizer identity should appear in the header/footer, login page, event information, and official information sections.

Do not make IDI branding overpower the RUN IDI RUN event branding.

RUN IDI RUN is the main event identity.

# 16. Hero Section

Hero should be the strongest visual section.

Recommended concept:

```text
RUN
IDI
RUN

Langkah Sehat
Untuk Negeri

27 SEPTEMBER 2026
Stadion A. Yani
Sumenep
```

Visual hierarchy:

```text
RUN
  ↓
IDI
  ↓
RUN
  ↓
event tagline
  ↓
event information
```

Use black/red contrast.

# 17. Graphic Style

Use graphic elements inspired by running event posters.

Preferred:

- Brush strokes
- Dynamic diagonal lines
- Bold typography
- Number typography
- Circular badges
- Strong blocks
- Motion lines
- Minimal medical line-art

Avoid:

- Glassmorphism
- Neon gradients
- Excessive 3D
- Corporate blue gradients
- Generic SaaS illustrations
- Excessive rounded cards
- Excessive shadows

# 18. Iconography

Use simple modern line icons.

Preferred icon style:

- 1.5–2px stroke
- Rounded line caps
- Minimal details
- Consistent visual weight

Suitable icons:

- Search
- User
- Running
- Heart
- Medical cross
- Calendar
- Location
- Shirt
- Ticket
- Check
- Alert

Do not mix multiple icon styles.

# 19. Photography

Photography should focus on:

- Runners
- Medical professionals
- Doctors
- Healthy lifestyle
- Community running
- Human movement
- Event atmosphere

Images should feel authentic.

Avoid generic corporate stock photography.

Preferred characteristics:

- Dynamic movement
- Outdoor environment
- Warm natural lighting
- Indonesian participants
- Medical professionals when appropriate
- Green running/event clothing
- Strong human expressions

# 20. Image Treatment

Images can be combined with:

- Cream backgrounds
- Red overlays
- Black typography
- Green accents
- Cropped athletic compositions

Use large subject crops.

Avoid overly polished corporate photo treatments.

The image should feel like a real running event.

# 21. Responsive Design

The design must be mobile-first.

Primary users may use:

- Smartphone
- Tablet
- Laptop

The racepack pickup screen must work extremely well on mobile.

Mobile priorities:

```text
Search
↓
Participant
↓
Verification
↓
Pickup
```

Do not force users to navigate through multiple pages.

# 22. Accessibility

Maintain strong contrast.

Do not rely only on color to communicate status.

Bad:

```text
green = success
red = error
```

Better:

```text
✓ SUDAH DIAMBIL
```

and:

```text
⚠ BELUM DIAMBIL
```

Buttons must have sufficient touch area.

Text must remain readable against the cream background.

# 23. Animation

Animation should communicate interaction, loading, success, or transition.

Preferred duration:

```text
150–250ms
```

Avoid:

- Excessive parallax
- Long page animations
- Constant moving elements
- Heavy particle effects
- Background animations

Performance is more important than decoration.

# 24. Performance

The visual system must not compromise application performance.

Avoid:

- Large background videos
- Huge unoptimized images
- Heavy animation libraries
- Excessive SVG assets
- Unnecessary web fonts
- Large JavaScript bundles

Use optimized Next.js image handling.

Prefer:

- WebP/AVIF
- Responsive images
- Lazy loading
- Minimal fonts
- CSS-based decorative elements

The primary racepack workflow must remain fast even on average mobile devices and imperfect event connectivity.

# 25. Tailwind Design Tokens

Recommended base tokens:

```css
--color-cream: #F3E8D2;
--color-black: #111111;
--color-red: #D71920;
--color-green: #26734D;
--color-green-light: #5C9B78;
--color-gold: #D4B84C;
--color-neutral: #E6D8BE;
```

These colors should be centralized in the Tailwind/theme configuration rather than repeatedly hardcoded throughout components.

# 26. UI Surface Hierarchy

### Level 1 — Main Background

```text
#F3E8D2
```

### Level 2 — Card / Content Surface

Use slightly lighter cream or neutral surfaces.

### Level 3 — Important Dark Section

```text
#111111
```

### Level 4 — Primary Action

```text
#D71920
```

### Level 5 — Success / Health

```text
#26734D
```

Do not create many additional colors.

# 27. Login Page

The login page should feel like the official RUN IDI RUN event platform.

Recommended composition:

```text
RUN
IDI
RUN

RACEPACK MANAGEMENT

[ Email ]

[ Password ]

[ MASUK ]

Ikatan Dokter Indonesia
Kabupaten Sumenep
```

Use the cream background with black/red typography. A subtle running/health visual may be used on desktop.

On mobile, prioritize fast login.

# 28. Search Results

Search results must be compact and scannable.

Recommended card:

```text
BUDI SANTOSO
BIB 40001

10K · JERSEY L
TRIBUN

✓ BELUM DIAMBIL
```

When multiple participants have similar names, show additional information needed for disambiguation.

Never automatically merge duplicate names.

# 29. Participant Detail

Prioritize the information required for racepack verification.

Recommended order:

1. Name
2. BIB
3. Category
4. Jersey size
5. Registration source
6. Other verification data where authorized
7. Pickup status

Avoid exposing unnecessary personal information to ordinary staff.

# 30. Error and Empty States

Use the RUN IDI RUN visual language.

Examples:

```text
PESERTA TIDAK DITEMUKAN
```

```text
RACEPACK SUDAH DIAMBIL
```

```text
KONEKSI BERMASALAH
SILAKAN COBA LAGI
```

Use clear iconography and typography.

Do not rely only on red/green color.

# 31. Design Rules

Always:

- Preserve RUN IDI RUN identity.
- Use cream as the primary visual foundation.
- Use black for strong typography.
- Use red for energy and primary actions.
- Use green for health and success.
- Use gold sparingly for race/achievement.
- Use bold athletic typography.
- Maintain high contrast.
- Keep the interface clean.
- Prioritize usability.
- Prioritize performance.
- Keep the visual connection with the supplied poster.

Never:

- Turn the UI into a generic blue healthcare dashboard.
- Overuse gradients.
- Overuse rounded cards.
- Overuse shadows.
- Use neon colors.
- Use excessive glassmorphism.
- Use decorative elements that slow down the application.
- Use excessive animation.
- Sacrifice readability for visual style.

# 32. Brand Consistency

The website and physical event materials should feel like the same brand.

If the poster uses:

```text
Cream + Black + Red + Green
```

the website should use the same foundation.

If the poster emphasizes:

```text
RUN
IDI
RUN
```

the website should maintain the same typographic energy.

If the poster communicates:

```text
Langkah Sehat Untuk Negeri
```

the website should preserve this as an important supporting message.

# 33. Overall Visual Formula

The core design formula is:

```text
RUNNING ENERGY
        +
MEDICAL PROFESSIONALISM
        +
SUMENEP COMMUNITY
        +
BOLD TYPOGRAPHY
        +
WARM CREAM BACKGROUND
        +
BLACK / RED / GREEN
        =
RUN IDI RUN
```

The website should immediately feel connected to the official RUN IDI RUN poster.

When a user sees the website and the physical event poster side by side, they should clearly recognize them as belonging to the same event.

# 34. Implementation Priority

When visual decisions conflict, prioritize in this order:

1. Usability
2. Performance
3. Accessibility
4. Brand consistency
5. Visual decoration

The racepack pickup workflow is more important than visual effects.

The interface must remain fast and clear during the actual event.

# 35. Final Design Principle

> **RUN IDI RUN is a health movement expressed through running.**

The UI should make users feel:

> **"Saya sedang berada di platform resmi event RUN IDI RUN dari IDI Sumenep."**

It should feel energetic enough for a running event, trustworthy enough for a medical organization, and simple enough for staff to operate quickly during racepack distribution.
