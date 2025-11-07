-- 🔧 ПОЛНОЕ ИСПРАВЛЕНИЕ ВСЕХ ФУНКЦИЙ И ПОЛИТИК
-- Проблема: функции используют profiles.user_id вместо profiles.id

-- ============================================
-- 1. ИСПРАВЛЕНИЕ ФУНКЦИИ sync_user_profile
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_user_profile(_user_id uuid, _email text, _display_name text DEFAULT NULL, _avatar_url text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_profile profiles%ROWTYPE;
  result jsonb;
BEGIN
  -- Check if profile exists (используем id вместо user_id)
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE id = _user_id;  -- ✅ ИСПРАВЛЕНО: было user_id = _user_id
  
  IF existing_profile.id IS NULL THEN
    -- Create new profile
    INSERT INTO public.profiles (id, user_id, display_name, preferred_language, role)
    VALUES (
      _user_id,  -- id
      _user_id,  -- user_id (должны быть равны)
      COALESCE(_display_name, split_part(_email, '@', 1)),
      'uk',
      'user'
    );
    
    result := jsonb_build_object(
      'action', 'created',
      'user_id', _user_id,
      'email', _email,
      'role', 'user'
    );
  ELSE
    -- Update existing profile if display_name or avatar_url provided
    IF _display_name IS NOT NULL OR _avatar_url IS NOT NULL THEN
      UPDATE public.profiles 
      SET 
        display_name = COALESCE(_display_name, display_name),
        avatar_url = COALESCE(_avatar_url, avatar_url),
        updated_at = now()
      WHERE id = _user_id;  -- ✅ ИСПРАВЛЕНО: было user_id = _user_id
    END IF;
    
    result := jsonb_build_object(
      'action', 'updated',
      'user_id', _user_id,
      'email', _email,
      'role', existing_profile.role
    );
  END IF;
  
  RETURN result;
END;
$$;

-- ============================================
-- 2. ИСПРАВЛЕНИЕ ФУНКЦИИ has_admin_access
-- ============================================
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
    WHERE id = auth.uid()  -- ✅ ИСПРАВЛЕНО: было user_id = auth.uid()
    AND role IN ('superadmin', 'admin')
  );
$$;

-- ============================================
-- 3. ИСПРАВЛЕНИЕ RLS ПОЛИТИК role_changes
-- ============================================
DROP POLICY IF EXISTS "Admins can view role change history" ON public.role_changes;
DROP POLICY IF EXISTS "Admins can insert role changes" ON public.role_changes;

CREATE POLICY "Admins can view role change history"
ON public.role_changes FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid()  -- ✅ ИСПРАВЛЕНО
    AND role IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Admins can insert role changes"
ON public.role_changes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid()  -- ✅ ИСПРАВЛЕНО
    AND role IN ('superadmin', 'admin')
  )
);

-- ============================================
-- 4. ПРОВЕРКА: все функции и политики
-- ============================================

-- Проверить sync_user_profile
SELECT 'sync_user_profile fixed' as status;

-- Проверить has_admin_access
SELECT 'has_admin_access fixed' as status;

-- Проверить RLS политики
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'role_changes';

-- ============================================
-- 5. ТЕСТ: создать запись в role_changes
-- ============================================

-- Получить первого пользователя (не суперадмина)
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    SELECT id INTO test_user_id 
    FROM public.profiles 
    WHERE role != 'superadmin'
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Изменить роль для теста
        PERFORM public.change_user_role_by_id(test_user_id, 'editor');
        RAISE NOTICE '✅ Test role change created for user: %', test_user_id;
    ELSE
        RAISE NOTICE '⚠️ No users found to test';
    END IF;
END $$;

-- ============================================
-- 6. ФИНАЛЬНАЯ ПРОВЕРКА
-- ============================================

-- Проверить количество записей
SELECT 
    COUNT(*) as total_role_changes,
    MAX(created_at) as last_change
FROM public.role_changes;

-- Показать последние изменения с профилями
SELECT 
    rc.id,
    rc.created_at,
    rc.old_role || ' → ' || rc.new_role as role_change,
    tp.display_name as target_user,
    cp.display_name as changed_by
FROM public.role_changes rc
LEFT JOIN public.profiles tp ON rc.target_user_id = tp.id
LEFT JOIN public.profiles cp ON rc.changed_by = cp.id
ORDER BY rc.created_at DESC
LIMIT 5;

-- Показать вашу роль
SELECT 
    id,
    display_name,
    role,
    'You are: ' || role as status
FROM public.profiles
WHERE id = auth.uid();



