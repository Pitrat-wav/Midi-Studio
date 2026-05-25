## 2025-05-15 - [Telegram-Centric UX & Haptics]
**Learning:** In a Telegram Mini App context, integrating native haptic feedback (`window.Telegram.WebApp.HapticFeedback`) significantly improves the perceived "feel" of virtual hardware controls (knobs, sliders, buttons) by providing tactile confirmation that mirrors physical equipment.
**Action:** Always check for `window.Telegram?.WebApp?.HapticFeedback` availability and integrate `selectionChanged` for continuous controls and `impactOccurred` for discrete actions.

## 2025-05-15 - [Inclusive Controls for Screen Readers]
**Learning:** Hidden range inputs used for rotary knobs and sliders require explicit `aria-label` attributes to be useful for assistive technologies, as the visual label might not be programmatically associated with the input.
**Action:** Ensure all `input[type="range"]` elements, especially those styled to look like knobs, have descriptive `aria-label` or `aria-labelledby`.

## 2025-05-15 - [Consistent Navigation Interactivity]
**Learning:** Navigation buttons benefit from a combination of tactile (Haptic Feedback), semantic (ARIA labels/pressed), and visual (neon glow focus states) cues to provide a "premium" feel while remaining fully accessible to keyboard and screen reader users.
**Action:** When implementing or updating navigation menus, always include `aria-label` with shortcut hints, `aria-pressed` for active states, Telegram haptics for clicks, and `:focus-visible` glow effects.

## 2026-05-25 - [Contextual Value Feedback for Screen Readers]
**Learning:** For custom-styled controls using hidden range inputs (like `StudioKnob` and `StudioSlider`), raw numeric values announced by screen readers can be confusing without units. Using `aria-valuetext` allows providing a formatted, context-aware string (e.g., "75.0%") that improves clarity.
**Action:** Always implement `aria-valuetext` on range inputs in core UI components, dynamically appending units (like "%" or "dB") based on the control's purpose.
