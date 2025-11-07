-- 🔧 ИСПРАВЛЕНИЕ RLS ПОЛИТИК ДЛЯ ТАБЛИЦЫ role_changes
-- Проблема: политики используют profiles.user_id вместо profiles.id

-- 1. Удаляем старые политики
DROP POLICY IF EXISTS "Admins can view role change history" ON public.role_changes;
DROP POLICY IF EXISTS "Admins can insert role changes" ON public.role_changes;

-- 2. Создаём правильные политики (используя profiles.id)
CREATE POLICY "Admins can view role change history"
ON public.role_changes FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid()  -- ✅ ИСПРАВЛЕНО: было user_id = auth.uid()
    AND role IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Admins can insert role changes"
ON public.role_changes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid()  -- ✅ ИСПРАВЛЕНО: было user_id = auth.uid()
    AND role IN ('superadmin', 'admin')
  )
);

-- 3. Проверяем, что политики созданы правильно
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'role_changes';

-- 4. Проверяем доступ (должен вернуть записи, если вы админ)
SELECT COUNT(*) as total_records FROM public.role_changes;

-- 5. Если таблица пустая - создайте тестовую запись
-- DO $$
-- DECLARE
--     first_user_id uuid;
-- BEGIN
--     SELECT id INTO first_user_id 
--     FROM public.profiles 
--     WHERE role != 'superadmin'
--     LIMIT 1;
--     
--     IF first_user_id IS NOT NULL THEN
--         PERFORM public.change_user_role_by_id(first_user_id, 'editor');
--         RAISE NOTICE 'Test role change created for user: %', first_user_id;
--     END IF;
-- END $$;

-- 6. Финальная проверка
SELECT 
    rc.id,
    rc.created_at,
    rc.old_role,
    rc.new_role,
    tp.display_name as target_user,
    cp.display_name as changed_by_user
FROM public.role_changes rc
LEFT JOIN public.profiles tp ON rc.target_user_id = tp.id
LEFT JOIN public.profiles cp ON rc.changed_by = cp.id
ORDER BY rc.created_at DESC
LIMIT 10;



