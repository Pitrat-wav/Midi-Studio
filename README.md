# Telegram MIDI Studio

Музыкальная студия для создания генеративных MIDI-паттернов внутри Telegram. Приложение сочетает в себе классический аналоговый синтез и современные алгоритмы композиции.

## 🚀 Основные возможности

- **Acid Bass**: Эмуляция легендарного Roland TB-303 с алгоритмом генерации "Sting".
- **Euclidean Drums**: Ритмы на основе эвклидовой геометрии с использованием сэмплов 808 и 909.
- **Hybrid Sequencer**: Секвенсор ML-185, объединенный с мелодической сеткой MDD Snake.
- **Ambient Pads**: Автоматическая генерация атмосферных аккордов, подстраивающихся под выбранную гармонию.
- **Global Harmony**: Управление тональностью и ладом для всех инструментов.
- **MIDI Export**: Экспорт созданных идей в 4-дорожечный MIDI-файл прямо в чат Telegram.

## 🛠 Технический стек

- **Frontend**: React + Vite + TypeScript.
- **Audio Core**: Tone.js (Web Audio API).
- **State**: Zustand.
- **TMA SDK**: @telegram-apps/sdk.
- **Design**: Vanilla CSS с использованием переменных тем Telegram.

## 📦 Установка и запуск

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Запустите в режиме разработки:
   ```bash
   npm run dev
   ```
3. Соберите проект для продакшена:
   ```bash
   npm run build
   ```

## 📄 Документация

- [Журнал изменений (CHANGELOG.md)](./CHANGELOG.md)
- [Техническая документация (.agent/AGENT_DOCS.md)](./.agent/AGENT_DOCS.md)
- [Аудит дизайна (Documentation/UI_UX_AUDIT.md)](./Documentation/UI_UX_AUDIT.md)

---
Разработано специально для Telegram Mini Apps.
