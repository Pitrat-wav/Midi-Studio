# 🎹 Midi-Studio — Studio Elite 3D

**Профессиональная MIDI-студия в браузере с Telegram интеграцией**

![Version](https://img.shields.io/badge/version-5.0.0-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

---

## 🚀 Быстрый старт

### Установка

```bash
# Клонируйте репозиторий
git clone https://github.com/Pitrat-wav/Midi-Studio.git
cd Midi-Studio-local

# Установите зависимости
npm install

# Запустите dev-сервер
npm run dev
```

### Сборка для production

```bash
npm run build
npm run preview  # Preview production сборки
```

---

## 🎮 Управление

### Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| **SPACE** | Play/Stop |
| **1-7** | Выбор инструмента (Drums, Bass, Harmony, Pads, Sequencer, Drone, Master) |
| **B** | Переключение темы фона (Космос → Студия → South Park) |
| **H** | Скрыть/Показать HUD |
| **?** | Help overlay |
| **Tab** | Переключение вида (3D / Nodes / Live / Arrange) |
| **`** (backtick) | Terminal overlay |
| **P** | Panic (остановить все звуки) |

### Инструменты

1. **🥁 Drums** — TR-808/909 Drum Machine
2. **🎸 Bass** — TB-303 Acid Bass / FM Synth
3. **🎹 Harmony** — Buchla 259 Complex Oscillator
4. **☁️ Pads** — Ambient Pad Engine
5. **🎬 Sequencer** — Turing Machine & ML-185
6. **☄️ Drone** — Drone Engine
7. **🎚️ Master** — Master Control Center

---

## 🎨 Темы

Приложение поддерживает 3 визуальные темы:

| Тема | Описание | Как активировать |
|------|----------|------------------|
| 🌌 **Deep Space** | Космическая сцена с звёздами | Нажимать **B** пока не увидите "🌌 Space" |
| 🏭 **Studio 2026** | Профессиональная студия с неоновым освещением | Нажимать **B** пока не увидите "🏭 Studio" |
| 🎨 **South Park** | Стилизованная тема | Нажимать **B** пока не увидите "🎨 South Park" |

---

## 🛠️ Технологии

- **Frontend:** React 18, TypeScript, Vite
- **3D Graphics:** Three.js, React Three Fiber, Drei
- **Audio:** Tone.js, Web Audio API
- **State Management:** Zustand
- **Telegram Integration:** Telegram WebApp SDK

---

## 📁 Структура проекта

```
src/
├── components/
│   ├── HUD/           # 2D контроллеры инструментов
│   ├── WebGL/         # 3D компоненты
│   └── VisualEngine/  # Визуализаторы
├── store/             # Zustand stores
├── logic/             # Бизнес-логика
├── lib/               # Утилиты
└── shaders/           # GLSL шейдеры
```

---

## 🔧 Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Frontend
VITE_API_URL=http://localhost:3001
VITE_APP_MODE=development
```

### Backend

Backend находится в папке `backend/`:

```bash
cd backend
cp .env.example .env
# Отредактируйте .env и добавьте BOT_TOKEN
npm install
npm run dev
```

---

## 📊 Производительность

- **Bundle size:** 2.77MB JS, 129KB CSS (gzipped)
- **Build time:** ~3.3s
- **FPS:** 60 (на современных устройствах)

---

## 🤝 Вклад

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push на branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 📝 License

MIT

---

## 📞 Контакты

- **GitHub:** https://github.com/Pitrat-wav/Midi-Studio
- **Telegram:** [@yourbot](https://t.me/yourbot)
