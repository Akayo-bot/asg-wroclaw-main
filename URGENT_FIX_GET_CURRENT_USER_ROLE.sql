-- ======================================================================
-- СРОЧНОЕ ИСПРАВЛЕНИЕ: column p.user_id does not exist
-- Эта миграция ПРИНУДИТЕЛЬНО исправляет функцию get_current_user_role()
-- ======================================================================

-- 1. Удаляем ВСЕ версии функции get_current_user_role
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT (p.oid::regprocedure)::text AS regproc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_current_user_role'
  LOOP
    BEGIN
      EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE;', r.regproc);
      RAISE NOTICE 'Dropped function: %', r.regproc;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to drop function %: %', r.regproc, SQLERRM;
    END;
  END LOOP;
END$$;

-- 2. Создаем ПРАВИЛЬНУЮ версию функции, используя profiles.id
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Проверяем, что функция работает
DO $$
DECLARE
  test_role user_role;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    BEGIN
      SELECT public.get_current_user_role() INTO test_role;
      RAISE NOTICE 'SUCCESS: Function get_current_user_role() is working. Current user role: %', COALESCE(test_role::text, 'NULL');
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'ERROR: Function get_current_user_role() returned error: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'User not authenticated, cannot test function';
  END IF;
END$$;

-- 4. Добавляем комментарий
COMMENT ON FUNCTION public.get_current_user_role() IS 'Gets current user role using profiles.id (PRIMARY KEY). FIXED: uses id instead of user_id';

