# 📖 STUDIO ELITE 3D: AGENT BIBLE (v5.0.0)

**ВНИМАНИЕ АГЕНТУ:** Это единственный источник правды. Игнорируй любые файлы, называющие этот проект "Telegram Mini App". Это полноценная **3D Audio Workstation** для веба.

---

## 1. Идентичность Проекта
- **Название**: Studio Elite 3D.
- **Версия**: 5.0.0 (Agentic Update).
- **Среда**: Любой современный браузер (Chrome, Safari, Firefox). Поддержка Telegram WebView есть, но она вторична.
- **Жанр**: Gamified DAW (Digital Audio Workstation) / Generative Environment.

---

## 2. Технический Стек ("Golden Triangle")
Проект держится на трех китах:

1.  **VISUAL (Three.js / R3F)**
    - Движок: `@react-three/fiber`, `@react-three/drei`.
    - Рендер: WebGL. Все инструменты — это 3D объекты.
    - Шейдеры: Кастомные материалы для планет и частиц.

2.  **AUDIO (Tone.js)**
    - Движок: `tone`.
    - Архитектура: Граф нод.
    - Синхронизация: `Tone.Transport` (Главные часы).

3.  **STATE (Zustand)**
    - Менеджер: `zustand`.
    - Stores:
        - `audioStore`: Транспорт, BPM, Мастер.
        - `visualStore`: Камера, фокус, Hand Tracking данные.
        - `aiStore`: Ключи API, генерация текстур.
        - `nodeStore`: Граф редактора нод.

---

## 3. Neural Engine (AI Integration)
Проект использует нейросети на клиенте и через API.

### 👁 Vision (MediaPipe)
- **Библиотека**: `@mediapipe/tasks-vision`.
- **Файл**: `src/hooks/useHandTracking.ts`.
- **Функция**: Распознавание рук через веб-камеру для жестового управления в 3D пространстве.
- **Статус**: Experimental. Включается в настройках.

### 🎨 Generative (Hugging Face)
- **Библиотека**: `@huggingface/inference`.
- **Файл**: `src/store/aiStore.ts`.
- **Функция**: Генерация текстур для планет/инструментов по текстовому промпту (Text-to-Image).
- **Модель**: `stabilityai/stable-diffusion-xl-base-1.0`.

---

## 4. Системы Ввода
1.  **Gamepad (PS5 DualSense)**: Основной способ управления. Ходьба, обзор, шорткаты. См. `GamepadManager.ts`.
2.  **Keyboard/Mouse**: WASD полет, драг для вращения.
3.  **Touch**: Мультитач для зума и вращения на мобильных.

---

## 5. Файловая Карта
- **`src/logic`**: Чистая бизнес-логика (не React). Здесь живут секвенсоры.
- **`src/store`**: Все данные приложения.
- **`src/components/WebGL`**: 3D мир.
    - `instruments/`: 3D модели синтезаторов.
    - `controls/`: 3D ручки, слайдеры.
- **`src/components/HUD`**: 2D интерфейс поверх Canvas (Html Overlay).
- **`src/lib/AudioVisualBridge.ts`**: Мост событий `beat` -> 3D анимация.

---

## 6. Правила Разработки
1.  **Performance First**: Никаких тяжелых вычислений в `useFrame` без необходимости.
2.  **Audio Priority**: Аудио-поток (Tone.js) неприкосновенен. Не блокировать UI.
3.  **Clean Code**: Строгая типизация TS.

---
*Документ обновлен: 1 Февраль 2026.*
