-- 🔍 ДИАГНОСТИКА ИСТОРИИ ИЗМЕНЕНИЙ РОЛЕЙ

-- 1. Проверить, есть ли данные в таблице role_changes
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT target_user_id) as unique_users_affected,
    COUNT(DISTINCT changed_by) as unique_changers,
    MIN(created_at) as first_change,
    MAX(created_at) as last_change
FROM public.role_changes;

-- 2. Проверить foreign keys
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.role_changes'::regclass
  AND contype = 'f';

-- 3. Проверить последние 10 изменений с JOIN
SELECT 
    rc.id,
    rc.created_at,
    rc.old_role,
    rc.new_role,
    rc.reason,
    tp.id as target_id,
    tp.display_name as target_name,
    tp.avatar_url as target_avatar,
    cp.id as changer_id,
    cp.display_name as changer_name,
    cp.avatar_url as changer_avatar
FROM public.role_changes rc
LEFT JOIN public.profiles tp ON rc.target_user_id = tp.id
LEFT JOIN public.profiles cp ON rc.changed_by = cp.id
ORDER BY rc.created_at DESC
LIMIT 10;

-- 4. Проверить индексы
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'role_changes';

-- 5. Показать все профили пользователей для reference
SELECT 
    id,
    display_name,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- 6. 🚀 СОЗДАТЬ ТЕСТОВОЕ ИЗМЕНЕНИЕ РОЛИ (если история пустая)
-- Замените YOUR_USER_EMAIL на реальный email пользователя из вашей базы

-- Вариант 1: Изменить роль по email
-- SELECT public.change_user_role('YOUR_USER_EMAIL', 'editor');

-- Вариант 2: Изменить роль по ID (быстрее)
-- SELECT public.change_user_role_by_id('YOUR_USER_ID', 'admin');

-- 7. Проверить, что функции существуют
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prosecdef as is_security_definer
FROM pg_proc
WHERE proname IN ('change_user_role', 'change_user_role_by_id')
  AND pronamespace = 'public'::regnamespace;

-- 8. Проверить RLS политики на role_changes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'role_changes';



