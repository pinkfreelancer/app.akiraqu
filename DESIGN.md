# DESIGN.md - Impeccable Design System Specification
**Project:** NexusTrade AI: Multi-Indicator Institutional Crypto Analyzer  
**Framework:** Impeccable Anti-Slop Specification (impeccable.style)  
**Standard:** WCAG AA Compliant | OKLCH Color Engine | 8pt Spatial Grid

## 1. Design Strategy Pass
- **Interface Archetype:** Product-first, dense developer & quantitative trader utility
- **Visual Density:** Comfortable density with crisp information hierarchy
- **Design Variance:** Low variance, high component consistency
- **Motion Intensity:** Subtle & purposeful (spring physics: 300 stiffness, 25 damping)
- **Typography Direction:** Fluid optical clamp scale with zero generic slop

## 2. Color System (OKLCH Light & Dark)
*All neutral scales are tinted with Hue 240.*
- **Canvas / Background**: `oklch(0.135 0.015 240)` (#090d16)
- **Surface**: `oklch(0.17 0.018 240)` (#0f172a)
- **Border**: `oklch(0.24 0.02 240)` (#1e293b)
- **Foreground**: `oklch(0.97 0.005 240)` (#f8fafc)
- **Muted**: `oklch(0.68 0.015 240)` (#94a3b8)
- **Bullish Accent**: `#00F2FE` (Cyan 400) / `#10b981` (Emerald)
- **Bearish Accent**: `#FF3366` (Rose 500) / `#ef4444` (Red)

## 3. Typographic Hierarchy & Scale
- Display Font: `Plus Jakarta Sans, system-ui, sans-serif`
- Body Font: `Inter, system-ui, sans-serif`
- Code/Data: `JetBrains Mono, monospace`
- Step Ratio: Major Third (1.25)
- Baseline Rule: Line height 1.5 - 1.7, single-line pills.

## 4. Layout Discipline & Mathematical Spacing
1. 8pt Grid Discipline: All margins, paddings, and heights align to multiples of 8px.
2. Button Padding 2:1 Ratio: Horizontal padding is strictly 2x vertical padding.
3. Outer >= Inner Padding: Container outer padding always >= inner gap spacing.
4. Corner Radius Nesting Formula: `Inner Radius = Outer Radius - Padding`.
5. Flatten Depth: Group related items with negative space and subtle dividers instead of concentric boxes.
