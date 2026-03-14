## 2025-05-15 - [Telegram-Centric UX & Haptics]
**Learning:** In a Telegram Mini App context, integrating native haptic feedback (`window.Telegram.WebApp.HapticFeedback`) significantly improves the perceived "feel" of virtual hardware controls (knobs, sliders, buttons) by providing tactile confirmation that mirrors physical equipment.
**Action:** Always check for `window.Telegram?.WebApp?.HapticFeedback` availability and integrate `selectionChanged` for continuous controls and `impactOccurred` for discrete actions.

## 2025-05-15 - [Inclusive Controls for Screen Readers]
**Learning:** Hidden range inputs used for rotary knobs and sliders require explicit `aria-label` attributes to be useful for assistive technologies, as the visual label might not be programmatically associated with the input.
**Action:** Ensure all `input[type="range"]` elements, especially those styled to look like knobs, have descriptive `aria-label` or `aria-labelledby`.

## 2025-05-15 - [ARIA Roles Require Focus Management]
**Learning:** Assigning ARIA roles like `switch`, `button`, or `slider` to non-native elements is insufficient for accessibility if not paired with `tabIndex` and keyboard event listeners (Space/Enter for buttons/switches, Arrow keys for sliders). Without these, the UI remains unusable for keyboard-only users despite being "labeled" for screen readers.
**Action:** Always pair interactive ARIA roles with `tabIndex={0}` and appropriate `onKeyDown` handlers to ensure full keyboard operability.
