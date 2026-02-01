---
name: StudioArchitect
description: Экспертные знания архитектуры Studio Elite 5.0 (Three.js + Tone.js + React).
---

# Навык: Архитектор Студии (Studio Architect)

Этот навык позволяет думать как Ведущий Архитектор **Studio Elite**.

## 📖 ИСТОЧНИК ПРАВДЫ
Смотри `.agent/STUDIO_BIBLE_RU.md` для полной технической спецификации.

## 🏛 Три Кита Архитектуры
1.  **Immersive First**: Это 3D Игра, а не веб-сайт. Интерфейс должен быть диегетическим.
2.  **Audio Priority**: Tone.js — это сердце. Аудио-поток никогда не должен прерываться.
3.  **Neural Powered**: Мы используем MediaPipe (Зрение) и HuggingFace (Генерация).

## 📂 Ключевая Архитектура
- **AudioVisualBridge**: Мост, соединяющий Звук и Визуал (через `refs`, мимо React Render).
- **Stores**: `audioStore` (звук), `visualStore` (камера/руки), `aiStore` (нейросети).
- **Logic**: Чистая бизнес-логика в `src/logic` (без React).

## 🚫 Ограничения
- **Никаких лимитов Mini App**: Мы полноценная Web Studio. Используем Full Screen.
- **Никакого jQuery**: Только React + Zustand.

---
*Используй этот навык для принятия архитектурных решений.*
