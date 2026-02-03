# Neural Live Pro (HUD Component)

**Component:** `LiveSession.tsx`
**Purpose:** Provide a performance-oriented interface for clip launching, mixing, and FX.

## Structure
- **Clip Matrix:** 8x5 grid for launching loops.
- **Mixer:** Vertical faders for volume and Mute/Solo controls.
- **FX Pads:** Instant performance effects.
- **Visualizer:** FFT Spectrum analyzer.

---
## [UPDATE LOG] 2026-02-03 00:08:00
**Триггер:** Жалоба пользователя на "кривую" верстку ("crooked layout"). Несоответствие вертикального ряда сцен (8 кнопок) и горизонтальных рядов инструментов (5 рядов).
**Измененный элемент:** `LiveSession.tsx`, `LiveSession.css`

### Детали изменений (Diff Analysis)
- **[БЫЛО]:** Кнопки запуска сцен (`scene-launch-col`) располагались вертикальной колонкой справа от матрицы клипов. Это создавало визуальный диссонанс, так как 8 кнопок сцен не выравнивались с 5 рядами инструментов. Фейдеры микшера растягивались на всю высоту контейнера.
- **[СТАЛО]:** Кнопки запуска сцен перемещены в отдельный горизонтальный ряд (`scene-launch-row`) под матрицей клипов. Теперь каждая кнопка сцены (1-8) геометрически соответствует колонке клипов. Фейдеры микшера зафиксированы по высоте (220px).
- **[ТЕХНИЧЕСКИЕ ИЗМЕНЕНИЯ]:**
  - [MODIFIED] `LiveSession.tsx`: Перемещен блок mapping'а сцен из `clip-matrix` (справа) вниз контейнера.
  - [MODIFIED] `LiveSession.css`: Удален класс `.scene-launch-col`. Добавлен `.scene-launch-row` (flex-row).
  - [MODIFIED] `LiveSession.css`: `.fader-track-pro` получил `flex: 0 0 220px` и `margin: auto 0`.

### Глубокий разбор логики и математики
- **Логика:** Мы изменили ментальную модель интерфейса. Раньше предполагалось, что сцена — это "ряд" (как в Ableton), но визуально это конфликтовало с тем, что ряды — это инструменты. Теперь Сцена — это "колонка" (вертикальный срез времени), что логично: кнопка 1 запускает все клипы в колонке 1. Выравнивание теперь `1-to-1`.
