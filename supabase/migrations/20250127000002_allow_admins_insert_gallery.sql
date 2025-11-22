-- ПОЛІТИКА INSERT: Дозволяємо Адмінам/Редакторам завантажувати медіа
-- Це виправляє помилку 403 (Forbidden) при спробі вставити запис у gallery_items

-- Спочатку дропаємо існуючу політику "Editors and admins can manage gallery" якщо вона існує
-- (вона використовує FOR ALL, але може не працювати правильно для INSERT)
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

-- Коментарі для документації
COMMENT ON POLICY "Admins and Editors can insert media" ON public.gallery_items IS 
  'Дозволяє адмінам, суперадмінам та редакторам вставляти записи у gallery_items. 
   uploaded_by має відповідати auth.uid() для безпеки.';

COMMENT ON POLICY "Admins and Editors can update media" ON public.gallery_items IS 
  'Дозволяє адмінам, суперадмінам та редакторам оновлювати записи у gallery_items.';

COMMENT ON POLICY "Admins and Editors can delete media" ON public.gallery_items IS 
  'Дозволяє адмінам, суперадмінам та редакторам видаляти записи у gallery_items.';

