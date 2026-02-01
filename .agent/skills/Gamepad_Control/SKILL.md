---
name: Gamepad Control
description: Управление через геймпады (DualSense, Xbox).
---

# Навык: Геймпад Контроль

## 🎮 Gamepad API
- **Polling**: Геймпады не шлют события, их надо опрашивать в `useFrame`.
- **Manager**: Используй `GamepadManager.ts` (Singleton).

## 🗺 Маппинг (Mapping)
- **Стики**: Левый (WASD), Правый (Look). Применяй Deadzone (0.1), чтобы избежать дрифта.
- **Кнопки**:
  - `Cross`: Play/Stop.
  - `Circle`: Back/Mute.
  - `Triangle`: Panic.
  - `Square`: Context Menu/Zoom.

## 📳 Haptics (Вибрация)
- Используй `gamepad.vibrationActuator.playEffect()` для тактильной отдачи при нажатии кнопок.
