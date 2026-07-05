## 2025-05-15 - [Telegram-Centric UX & Haptics]
**Learning:** In a Telegram Mini App context, integrating native haptic feedback (`window.Telegram.WebApp.HapticFeedback`) significantly improves the perceived "feel" of virtual hardware controls (knobs, sliders, buttons) by providing tactile confirmation that mirrors physical equipment.
**Action:** Always check for `window.Telegram?.WebApp?.HapticFeedback` availability and integrate `selectionChanged` for continuous controls and `impactOccurred` for discrete actions.

## 2025-05-15 - [Inclusive Controls for Screen Readers]
**Learning:** Hidden range inputs used for rotary knobs and sliders require explicit `aria-label` attributes to be useful for assistive technologies, as the visual label might not be programmatically associated with the input.
**Action:** Ensure all `input[type="range"]` elements, especially those styled to look like knobs, have descriptive `aria-label` or `aria-labelledby`.

## 2025-05-15 - [Consistent Navigation Interactivity]
**Learning:** Navigation buttons benefit from a combination of tactile (Haptic Feedback), semantic (ARIA labels/pressed), and visual (neon glow focus states) cues to provide a "premium" feel while remaining fully accessible to keyboard and screen reader users.
**Action:** When implementing or updating navigation menus, always include `aria-label` with shortcut hints, `aria-pressed` for active states, Telegram haptics for clicks, and `:focus-visible` glow effects.

## 2025-05-15 - [Accessible Search & Command Palettes]
**Learning:** For command palettes and search overlays, implementing the full ARIA 1.2 Combobox pattern (using `aria-activedescendant` and `role="option"`) ensures that screen reader users can navigate results without losing focus from the input field. Stable IDs generated via `useId` are critical for these relationships.
**Action:** Always use `useId` to link search inputs to results via `aria-controls` and `aria-activedescendant` for any "omni-search" or instrument-selection UI.
