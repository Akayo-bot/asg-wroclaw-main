-- 🔧 ИСПРАВЛЕНИЕ ФУНКЦИИ has_admin_access
-- Проблема: функция может использовать profiles.user_id вместо profiles.id

-- 1. Проверим текущую функцию
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'has_admin_access'
  AND pronamespace = 'public'::regnamespace;

-- 2. Пересоздаём функцию с правильным полем
CREATE OR REPLACE FUNCTION public.has_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid()  -- ✅ ИСПРАВЛЕНО: используем id вместо user_id
    AND role IN ('superadmin', 'admin')
  );
$$;

-- 3. Проверяем, работает ли функция
SELECT public.has_admin_access() as i_am_admin;

-- 4. Проверяем свою роль
SELECT 
    id,
    display_name,
    role
FROM public.profiles
WHERE id = auth.uid();



