## 2025-05-15 - [Accessibility: Icon-only buttons]
**Learning:** Icon-only buttons (like '✕' for closing) are frequently missing `aria-label` attributes in this codebase, making them inaccessible to screen reader users.
**Action:** Always check for `aria-label` when encountering icon buttons and ensure they have descriptive labels (e.g., "Закрыть" or "Close").

## 2025-05-15 - [UX: Shortcut Consistency]
**Learning:** Keyboard shortcut documentation must be kept in sync with implementation to avoid user frustration. Overlapping shortcuts (like 0 opening a gallery instead of Overview) create navigation friction.
**Action:** Audit FAQ.tsx against KeyboardController.tsx whenever modifying navigation logic.
