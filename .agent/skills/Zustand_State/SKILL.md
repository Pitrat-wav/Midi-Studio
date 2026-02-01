---
name: Zustand State
description: Паттерны управления глобальным состоянием.
---

# Навык: Состояние Zustand

## 🧠 Философия
- **Atomic Selectors**: Выбирай только то, что нужно. `const bpm = useAudioStore(s => s.bpm)`.
- **No Providers**: Zustand работает вне React-дерева, что идеально для Audio-Bridge.

## 📦 Слайсы (Slices)
- **audioStore**: Всё, что звучит.
- **visualStore**: Всё, что светится.
- **themeStore**: Цвета и стили.

## 🚀 Transient Updates
Для данных с высокой частотой (60fps), например, анализатор спектра, НЕ используй состояние React.
Используй `Ref` или подписку `useStore.subscribe()`.
