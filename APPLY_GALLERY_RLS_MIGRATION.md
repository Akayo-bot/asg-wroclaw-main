# 🔧 Инструкция: Применение RLS миграции для Gallery

## Проблема
Ошибка **403 Forbidden** при попытке сохранить фото в галерею означает, что у вашей роли нет прав на INSERT в таблицу `gallery_items`.

## Решение

### Вариант 1: Через Supabase Dashboard (Рекомендуется)

1. Откройте **Supabase Dashboard** → ваш проект
2. Перейдите в **SQL Editor**
3. Скопируйте содержимое файла `supabase/migrations/20250127000002_allow_admins_insert_gallery.sql`
4. Вставьте в SQL Editor
5. Нажмите **Run** (или `Ctrl+Enter`)

### Вариант 2: Через Supabase CLI

```bash
# Если у вас установлен Supabase CLI
supabase migration up
```

### Вариант 3: Прямое выполнение SQL

Выполните этот SQL в Supabase SQL Editor:

```sql
-- ПОЛІТИКА INSERT: Дозволяємо Адмінам/Редакторам завантажувати медіа
-- Це виправляє помилку 403 (Forbidden) при спробі вставити запис у gallery_items

-- Спочатку дропаємо існуючу політику "Editors and admins can manage gallery" якщо вона існує
DROP POLICY IF EXISTS "Editors and admins can manage gallery" ON public.gallery_items;

-- Дропаємо нову політику INSERT якщо вона вже існує
DROP POLICY IF EXISTS "Admins and Editors can insert media" ON public.gallery_items;

-- Створюємо нову політику INSERT для gallery_items
CREATE POLICY "Admins and Editors can insert media"
ON public.gallery_items
FOR INSERT
TO authenticated
WITH CHECK (
    -- Ви можете вставити рядок ТІЛЬКИ від свого імені (безпека!)
    uploaded_by = auth.uid() 
    -- І ваша роль має бути однією з дозволених
    AND (get_current_user_role() IN ('superadmin', 'admin', 'editor'))
);

-- Створюємо політику UPDATE для gallery_items
CREATE POLICY "Admins and Editors can update media"
ON public.gallery_items
FOR UPDATE
TO authenticated
USING (
    get_current_user_role() IN ('superadmin', 'admin', 'editor')
)
WITH CHECK (
    get_current_user_role() IN ('superadmin', 'admin', 'editor')
);

-- Створюємо політику DELETE для gallery_items
CREATE POLICY "Admins and Editors can delete media"
ON public.gallery_items
FOR DELETE
TO authenticated
USING (
    get_current_user_role() IN ('superadmin', 'admin', 'editor')
);
```

## Проверка

После применения миграции:

1. Обновите страницу галереи
2. Попробуйте загрузить фото
3. Проверьте консоль браузера (F12) - там должны быть логи:
   - `Inserting gallery item with payload: ...`
   - `Successfully inserted gallery item: ...`

## Если ошибка все еще возникает

1. Проверьте, что вы вошли в систему как **admin**, **editor** или **superadmin**
2. Проверьте консоль браузера для детальных ошибок
3. Убедитесь, что функция `get_current_user_role()` работает правильно
4. Проверьте, что `uploaded_by` устанавливается правильно (должен быть равен `auth.uid()`)

## Дополнительная информация

- Миграция создает отдельные политики для INSERT, UPDATE и DELETE
- Политика INSERT проверяет, что `uploaded_by = auth.uid()` для безопасности
- Поддерживаются роли: `superadmin`, `admin`, `editor`

