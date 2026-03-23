## 2025-05-15 - [Telegram-Centric UX & Haptics]
**Learning:** In a Telegram Mini App context, integrating native haptic feedback (`window.Telegram.WebApp.HapticFeedback`) significantly improves the perceived "feel" of virtual hardware controls (knobs, sliders, buttons) by providing tactile confirmation that mirrors physical equipment.
**Action:** Always check for `window.Telegram?.WebApp?.HapticFeedback` availability and integrate `selectionChanged` for continuous controls and `impactOccurred` for discrete actions.

## 2025-05-15 - [Inclusive Controls for Screen Readers]
**Learning:** Hidden range inputs used for rotary knobs and sliders require explicit `aria-label` attributes to be useful for assistive technologies, as the visual label might not be programmatically associated with the input.
**Action:** Ensure all `input[type="range"]` elements, especially those styled to look like knobs, have descriptive `aria-label` or `aria-labelledby`.

## 2026-03-23 - [Keyboard Accessibility for Custom Controls]
**Learning:** For custom hardware-style controls (knobs/sliders) that use hidden native inputs, `:focus-within` on the parent wrapper is essential to provide visual feedback for keyboard users, as the focused element itself is invisible.
**Action:** Apply `:focus-within` styles to wrappers of hidden inputs to show a focus ring or glow that matches the control's aesthetic.
