## 2025-05-15 - [Telegram-Centric UX & Haptics]
**Learning:** In a Telegram Mini App context, integrating native haptic feedback (`window.Telegram.WebApp.HapticFeedback`) significantly improves the perceived "feel" of virtual hardware controls (knobs, sliders, buttons) by providing tactile confirmation that mirrors physical equipment.
**Action:** Always check for `window.Telegram?.WebApp?.HapticFeedback` availability and integrate `selectionChanged` for continuous controls and `impactOccurred` for discrete actions.

## 2025-05-15 - [Inclusive Controls for Screen Readers]
**Learning:** Hidden range inputs used for rotary knobs and sliders require explicit `aria-label` attributes to be useful for assistive technologies, as the visual label might not be programmatically associated with the input.
**Action:** Ensure all `input[type="range"]` elements, especially those styled to look like knobs, have descriptive `aria-label` or `aria-labelledby`.

## 2026-03-17 - [Visual Feedback for Keyboard Focus on Custom Controls]
**Learning:** Custom UI components that wrap hidden native inputs (like range sliders for knobs) must explicitly reflect the input's focus state on the wrapper element (e.g., using `:focus-within`) to provide essential visual feedback for keyboard-only users.
**Action:** Always implement `:focus-within` or focus state synchronization for custom wrappers that hide native interactive elements.
