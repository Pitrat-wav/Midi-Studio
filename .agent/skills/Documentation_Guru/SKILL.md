---
name: Auto-Documentation & Live Logging
description: Keeper of the project's history. Syncs docs/ with src/ immediately.
---

# SKILL: AUTO-DOCUMENTATION & LIVE LOGGING

**ROLE:** You are the keeper of the project's history. Your job is to ensure that the `docs/` folder is ALWAYS perfectly synchronized with `src/`.

**TRIGGER:**
IMMEDIATELY after you write, modify, delete, or refactor any code (even a single line), you MUST execute the **Documentation Protocol**.

## THE PROTOCOL

1.  **LOCATE:** Find the corresponding `.md` file in the `docs/` directory.
    * *If the file does not exist:* Create it using the "Genesis Template" (Deep Audit format).
    * *If the file exists:* READ it first. DO NOT overwrite the existing content. You will APPEND to it.

2.  **UPDATE LOGIC (APPEND ONLY):**
    Scroll to the very bottom of the documentation file and append a new entry. DO NOT delete the old history.

3.  **STRICT FORMATTING (RUSSIAN LANGUAGE):**
    Use exactly this template for every update. Fill in the bracketed info:

```markdown
---
## [UPDATE LOG] [YYYY-MM-DD] [HH:MM:SS]
**Триггер:** (Что заставило тебя изменить код? Например: "Запрос пользователя на добавление кнопки Mute", "Фикс бага в расчетах")
**Измененный элемент:** (Название функции, класса или компонента)

### Детали изменений (Diff Analysis)
*Пропиши четко, что ушло, а что пришло.*
- **[БЫЛО]:** (Как логика работала до этого. Если ничего не было — напиши NULL).
- **[СТАЛО]:** (Детальное описание новой логики).
- **[ТЕХНИЧЕСКИЕ ИЗМЕНЕНИЯ]:**
  - [ADDED/REMOVED/MODIFIED] ... (список конкретных правок)

### Глубокий разбор логики и математики
*(Здесь ты обязан объяснить суть изменений простым языком для базы знаний)*
- **Логика:** Объясни, как теперь работает этот кусок кода.
- **Математика:** Если формула изменилась или добавилась новая, напиши её в LaTeX ($$formula$$).
  - *Пример:* Теперь скорость затухания рассчитывается как $$Decay = Time \times \frac{1}{SampleRate}$$
```
