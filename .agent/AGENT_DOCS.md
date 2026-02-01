---
## [UPDATE LOG] [2026-02-02] [02:05:00]
**Триггер:** Реализация новых визуалов, интеграция физических контроллеров и AI Vision.
**Измененный элемент:** `VisualEngine`, `GamepadManager`, `controllers/LaunchControlXL`, `visualStore`

### Детали изменений (Diff Analysis)
- **[БЫЛО]:** 
  - Простой визуализатор с 3 пресетами.
  - Базовое управление геймпадом (дублирование функций студии).
  - Отсутствие MIDI-маппинга для внешних контроллеров.
  - Отсутствие поддержки веб-камеры и AI.
- **[СТАЛО]:** 
  - **SKELETON FLOW**: 4-й режим визуализации с трекингом скелета через MediaPipe. 
  - **GAMEPAD PRO**: Полный контроль визуалов (Reset, Detail, Speed) с D-Pad и Square кнопкой.
  - **LAUNCH CONTROL XL**: Автоматический маппинг всех фейдеров, кнобов и кнопок при подключении.
  - **VISION ANALYTICS**: Система "Computer Vision" инициализируется только по требованию.

### Глубокий разбор логики и математики
- **Логика (Launch Control):** Класс `LaunchControlXL` слушает `navigator.requestMIDIAccess` и автоматически перехватывает CC-сообщения, маршрутизируя их в `visualStore`. Фейдеры 1-8 мапятся на Intensity/Speed/Detail.
- **Логика (Skeleton Flow):** Использование `PoseLandmarker` от MediaPipe. Данные скелета (33 точки) нормализуются из `[0..1]` пространства экрана в `[-10..10]` пространство 3D сцены Three.js.
- **Математика:**
  $$Pos_{world} = (Pos_{norm} - 0.5) \times Scale$$
  Где $Scale$ подбирается под FOV камеры (в данном случае $Scale_{x}=20, Scale_{y}=16$).

### [ТЕХНИЧЕСКИЕ ИЗМЕНЕНИЯ]:
- [ADDED] `src/lib/controllers/LaunchControlXL.ts`
- [ADDED] `src/hooks/usePoseTracking.ts`
- [ADDED] `src/components/VisualEngine/visualizers/SkeletonFlow.tsx`
- [MODIFIED] `src/store/visualStore.ts` (Pose State, Reset Actions)
- [MODIFIED] `src/lib/GamepadManager.ts` (Reset mapping, D-Pad logic)
