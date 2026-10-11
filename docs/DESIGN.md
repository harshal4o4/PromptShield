# PromptShield Design System (Stitch Reference)

## Brand & Style
This design system embodies a mission-critical, high-assurance SecOps aesthetic tailored for AI safety engineers, Security Operations Center (SOC) analysts, and enterprise compliance teams. It delivers an uncompromising sense of precision, operational control, and real-time defense.

The visual style blends **Technical Minimalism** with **Instrument-Grade Information Architecture**. It rejects decorative novelty in favor of low-latency visual scanning, dense data legibility, and unmistakable state perception under cognitive load. Surfaces are deep, stable, and dark, allowing semantic threat signals to register immediately without eye strain during prolonged monitoring sessions. Structural boundaries rely on fine slate lines rather than heavy drop shadows, reinforcing a precise, digital-first apparatus engineered for modern threat interception.

## Color Palette Tokens

### Base Canvas & Layering
- `canvas-default`: `#090D16` / `#0B1326` (Deep Obsidian Navy)
- `surface-base`: `#0F172A` (Slate Base)
- `surface-raised`: `#1E293B` (Elevated Panel / Container)
- `surface-overlay`: `#243248` (Active / Hover / Modal Surface)
- `border-subtle`: `#334155` (Slate Structure Outline)
- `border-focus`: `#38BDF8` (Active Focus / Selection)

### Primary & Accent
- `primary`: `#06B6D4` (Electric Cyan – primary interactive elements, active telemetry toggles)
- `primary-hover`: `#22D3EE`
- `secondary`: `#38BDF8` (Ice Blue – secondary triggers, contextual metadata)
- `accent-violet`: `#8B5CF6` (Escalation / Human Review tier)

### SecOps Policy Status Tokens
- `status-allow`: `#10B981` (Emerald Green – clean, safe, pass-through)
  - Background: `rgba(16, 185, 129, 0.12)`, Border: `rgba(16, 185, 129, 0.35)`
- `status-block`: `#EF4444` (Crimson Red – immediate attack mitigation, policy violation)
  - Background: `rgba(239, 68, 68, 0.15)`, Border: `rgba(239, 68, 68, 0.45)`
- `status-sanitize`: `#F59E0B` (Amber – payload altered, PII redacted, prompt normalized)
  - Background: `rgba(245, 158, 11, 0.12)`, Border: `rgba(245, 158, 11, 0.35)`
- `status-escalate`: `#8B5CF6` (Violet – anomalous vector flagged for triage)
  - Background: `rgba(139, 92, 246, 0.12)`, Border: `rgba(139, 92, 246, 0.35)`

### Typography & Icon Contrast
- `text-primary`: `#F8FAFC`
- `text-secondary`: `#94A3B8`
- `text-tertiary`: `#64748B`
- `text-inverse`: `#090D16`

## Typography
- **Geist**: Administrative interface face for all headings, descriptive body text, operational notices, and dialogue flows.
- **JetBrains Mono**: Machine-generated telemetry: SHA-256 hashes, prompt tokens, embedded vectors, policy rule IDs, timestamp counters, and HTTP status/latency badges.

## Layout & Components
- **Sidebar Navigation**: Fixed left 64 (16rem), `#0B132B`, logo + status pill + 6 navigation links + analyst profile avatar.
- **Header**: Fixed top height 16 (4rem), breadcrumbs (`Platform / Console`), quick actions / profile.
- **Badges**: Monospace `JetBrains Mono`, height 24px, 2px 8px padding, 4px rounded radius.
