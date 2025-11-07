-- ======================================================================
-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: column p.user_id does not exist
-- Эта миграция исправляет все функции и RLS политики, использующие profiles.user_id
-- ======================================================================

-- ============================================
-- 0. Удаляем ВСЕ версии функций, чтобы избежать конфликтов
-- ============================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT (p.oid::regprocedure)::text AS regproc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_current_user_role',
        'get_admin_protection_status',
        'ensure_superadmin_exists',
        'change_user_role',
        'emergency_admin_recovery',
        'has_admin_access'
      )
  LOOP
    BEGIN
      EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE;', r.regproc);
    EXCEPTION WHEN OTHERS THEN
      -- Продолжаем, если удаление не удалось
      NULL;
    END;
  END LOOP;
END$$;

-- ============================================
-- 1. get_current_user_role() - использует profiles.id
-- ============================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_current_user_role() IS 'Gets current user role using profiles.id (PRIMARY KEY) instead of profiles.user_id';

-- ============================================
-- 2. get_admin_protection_status() - использует profiles.id
-- ============================================
CREATE OR REPLACE FUNCTION public.get_admin_protection_status()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'superadmin_count', (SELECT COUNT(*) FROM public.profiles WHERE role = 'superadmin'),
    'admin_count', (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin'),
    'total_admin_access', (SELECT COUNT(*) FROM public.profiles WHERE role IN ('superadmin','admin')),
    'current_user_role', (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'system_protected', (SELECT COUNT(*) FROM public.profiles WHERE role = 'superadmin') > 0
  );
$$;

COMMENT ON FUNCTION public.get_admin_protection_status() IS 'Gets admin protection status, uses profiles.id for current_user_role lookup';

-- ============================================
-- 3. ensure_superadmin_exists() - использует profiles.id
-- ============================================
CREATE OR REPLACE FUNCTION public.ensure_superadmin_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  superadmin_count INTEGER;
  fallback_user_id UUID;
BEGIN
  SELECT COUNT(*) INTO superadmin_count
  FROM public.profiles
  WHERE role = 'superadmin';

  IF superadmin_count = 0 THEN
    SELECT p.id INTO fallback_user_id
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE u.email = 'valera.dreus2001@gmail.com'
    LIMIT 1;

    IF fallback_user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET role = 'superadmin', updated_at = now()
      WHERE id = fallback_user_id;
      
      RAISE NOTICE 'Emergency SuperAdmin created for user: %', fallback_user_id;
    END IF;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.ensure_superadmin_exists() IS 'Ensures at least one SuperAdmin exists, uses profiles.id for JOINs';

-- ============================================
-- 4. change_user_role() - использует profiles.id
-- ============================================
CREATE OR REPLACE FUNCTION public.change_user_role(target_email text, new_role user_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  current_user_role user_role;
  target_current_role user_role;
  superadmin_count INTEGER;
BEGIN
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF current_user_role NOT IN ('superadmin', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  SELECT u.id, p.role INTO target_user_id, target_current_role
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  WHERE u.email = target_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF target_current_role = 'superadmin' THEN
    SELECT COUNT(*) INTO superadmin_count
    FROM public.profiles
    WHERE role = 'superadmin';

    IF superadmin_count <= 1 AND new_role <> 'superadmin' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Cannot remove the last SuperAdmin. System requires at least one SuperAdmin.'
      );
    END IF;

    IF current_user_role <> 'superadmin' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only SuperAdmin can modify SuperAdmin roles');
    END IF;
  END IF;

  IF new_role = 'superadmin' AND current_user_role <> 'superadmin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only SuperAdmin can assign SuperAdmin role');
  END IF;

  UPDATE public.profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Role updated successfully',
      'email', target_email,
      'previous_role', target_current_role,
      'new_role', new_role
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Failed to update role');
  END IF;
END;
$$;

COMMENT ON FUNCTION public.change_user_role(text, user_role) IS 'Changes user role, uses profiles.id instead of profiles.user_id';

-- ============================================
-- 5. emergency_admin_recovery() - ИСПРАВЛЕНО: включает user_id в INSERT
-- ============================================
CREATE OR REPLACE FUNCTION public.emergency_admin_recovery(recovery_code text, target_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  admin_count INTEGER;
  superadmin_count INTEGER;
  assigned_role user_role;
BEGIN
  IF recovery_code <> 'RAVEN_EMERGENCY_2024' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid recovery code');
  END IF;

  SELECT u.id INTO target_user_id
  FROM auth.users u
  WHERE u.email = target_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT COUNT(*) INTO superadmin_count FROM public.profiles WHERE role = 'superadmin';
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role IN ('superadmin','admin');

  IF superadmin_count = 0 THEN
    assigned_role := 'superadmin';
  ELSIF admin_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Admin access already exists in system');
  END IF;

  UPDATE public.profiles
  SET role = assigned_role, updated_at = now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    -- ИСПРАВЛЕНО: user_id обязателен (NOT NULL), нужно включать в INSERT
    INSERT INTO public.profiles (id, user_id, role, display_name)
    VALUES (target_user_id, target_user_id, assigned_role, target_email);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Emergency admin access restored',
    'email', target_email,
    'assigned_role', assigned_role
  );
END;
$$;

COMMENT ON FUNCTION public.emergency_admin_recovery(text, text) IS 'Emergency admin recovery function, uses profiles.id for updates';

-- ============================================
-- 6. has_admin_access() - использует profiles.id
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
    WHERE id = auth.uid()
      AND role IN ('superadmin','admin')
  );
$$;

COMMENT ON FUNCTION public.has_admin_access() IS 'Checks if current user has admin or superadmin role using profiles.id (PRIMARY KEY)';

-- ============================================
-- 7. RLS политики для profiles - используем только id
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON public.profiles;

CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles FOR SELECT
USING ( id = auth.uid() OR public.has_admin_access() );

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK ( id = auth.uid() );

CREATE POLICY "Users can update own profile or admins can update any"
ON public.profiles FOR UPDATE
USING ( id = auth.uid() OR public.has_admin_access() )
WITH CHECK ( id = auth.uid() OR public.has_admin_access() );

-- ============================================
-- 8. Финальная проверка: убеждаемся, что функция работает
-- ============================================
-- Проверка, что функция get_current_user_role() работает корректно
DO $$
DECLARE
  test_role user_role;
BEGIN
  -- Пытаемся вызвать функцию (если пользователь авторизован)
  IF auth.uid() IS NOT NULL THEN
    BEGIN
      SELECT public.get_current_user_role() INTO test_role;
      RAISE NOTICE 'Function get_current_user_role() is working. Current user role: %', test_role;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Function get_current_user_role() returned error: %', SQLERRM;
    END;
  END IF;
END$$;

