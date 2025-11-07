-- 📝 Создание тестовой записи в историю изменений ролей

-- Шаг 1: Получить список всех пользователей
SELECT 
    id,
    display_name,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- Шаг 2: Выберите любой ID из результата выше и вставьте вместо XXXX ниже
-- Шаг 3: Выполните одну из этих функций (раскомментируйте)

-- Вариант A: Изменить роль по ID (РЕКОМЕНДУЕТСЯ)
-- Замените 'PASTE_USER_ID_HERE' на реальный UUID из Шага 1
-- SELECT public.change_user_role_by_id('PASTE_USER_ID_HERE', 'editor');

-- Вариант B: Изменить роль по email (если знаете email)
-- Замените 'user@example.com' на реальный email
-- SELECT public.change_user_role('user@example.com', 'editor');

-- Шаг 4: Проверить, что запись создалась
SELECT 
    rc.*,
    tp.display_name as target_name,
    cp.display_name as changer_name
FROM public.role_changes rc
LEFT JOIN public.profiles tp ON rc.target_user_id = tp.id
LEFT JOIN public.profiles cp ON rc.changed_by = cp.id
ORDER BY rc.created_at DESC
LIMIT 5;

-- 🎯 БЫСТРЫЙ ТЕСТ (выполните всё за раз)
-- Это изменит роль первого пользователя на 'editor'
DO $$
DECLARE
    first_user_id uuid;
BEGIN
    -- Получить первого пользователя
    SELECT id INTO first_user_id 
    FROM public.profiles 
    WHERE role != 'superadmin' -- не трогаем суперадминов
    LIMIT 1;
    
    -- Изменить его роль
    IF first_user_id IS NOT NULL THEN
        PERFORM public.change_user_role_by_id(first_user_id, 'editor');
        RAISE NOTICE 'Role changed for user: %', first_user_id;
    ELSE
        RAISE NOTICE 'No users found to change role';
    END IF;
END $$;

-- Проверить результат
SELECT 
    COUNT(*) as total_role_changes,
    MAX(created_at) as last_change
FROM public.role_changes;

