---
name: AudioVisual Integration
description: Как интегрировать новые ауидо-инструменты в 3D сцену.
---

# Навык: Интеграция Аудио-Визуала

Этот навык описывает паттерн добавления нового генеративного инструмента.

## Архитектура
Инструмент состоит из 3 частей:
1.  **Store**: Логика + Tone.js синт.
2.  **3D Component**: R3F компонент.
3.  **Bridge**: Регистрация в `AudioVisualBridge`.

## Шаг 1: Audio Store
Файл: `src/store/instrumentNameStore.ts`
- Создай Zustand store.
- Инициализируй `Tone.Synth` внутри `initialize()`.
- Подключи к `Destination`.

## Шаг 2: Bridge
Файл: `src/lib/AudioVisualBridge.ts`
- Добавь аналайзер, если нужно.

## Шаг 3: 3D Component
Файл: `src/components/WebGL/instruments/MyInstrument3D.tsx`
- Используй `useAudioVisualBridge()`.
- Получай данные: `bridge.getPulse('channel')` (0.0 - 1.0).
- Анимируй через `useFrame`: `mesh.current.scale.setScalar(1 + pulse)`.

## Шаг 4: Spatial Layout
Файл: `src/lib/SpatialLayout.ts`
- Задай координаты `Vector3` в космосе.
