## 2025-05-15 - [Telegram-Centric UX & Haptics]
**Learning:** In a Telegram Mini App context, integrating native haptic feedback (`window.Telegram.WebApp.HapticFeedback`) significantly improves the perceived "feel" of virtual hardware controls (knobs, sliders, buttons) by providing tactile confirmation that mirrors physical equipment.
**Action:** Always check for `window.Telegram?.WebApp?.HapticFeedback` availability and integrate `selectionChanged` for continuous controls and `impactOccurred` for discrete actions.

## 2025-05-15 - [Inclusive Controls for Screen Readers]
**Learning:** Hidden range inputs used for rotary knobs and sliders require explicit `aria-label` attributes to be useful for assistive technologies, as the visual label might not be programmatically associated with the input.
**Action:** Ensure all `input[type="range"]` elements, especially those styled to look like knobs, have descriptive `aria-label` or `aria-labelledby`.

## 2025-05-15 - [Consistent Navigation Interactivity]
**Learning:** Navigation buttons benefit from a combination of tactile (Haptic Feedback), semantic (ARIA labels/pressed), and visual (neon glow focus states) cues to provide a "premium" feel while remaining fully accessible to keyboard and screen reader users.
**Action:** When implementing or updating navigation menus, always include `aria-label` with shortcut hints, `aria-pressed` for active states, Telegram haptics for clicks, and `:focus-visible` glow effects.

## 2026-05-28 - [Accessible Form Elements & Haptics]
**Learning:** Standard form elements like `select` and `input[type="range"]` in complex musical interfaces often lack proper `<label>` associations and tactile feedback. Explicitly linking labels with `htmlFor`/`id` and adding `selectionChanged()` haptic feedback on `onChange` significantly improves both accessibility for screen readers and the interaction "feel" for all users.
**Action:** Ensure all interactive form controls have associated labels and provide haptic feedback on state changes to maintain high standards of usability and professional "hardware-like" feel.
