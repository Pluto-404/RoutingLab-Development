-- READ-ONLY security checklist; run in SQL Editor as administrator.
-- An active RLS policy protects browser requests; PUBLIC/anon EXECUTE on
-- SECURITY DEFINER functions should be inspected carefully.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname='public'
  AND tablename IN ('profiles','classes','class_memberships','user_progress',
  'practice_events','mission_catalog','class_assignments','mission_attempts',
  'evaluation_sets','evaluation_questions','evaluation_assignments','evaluation_attempts')
ORDER BY tablename;

SELECT n.nspname AS schema_name,p.proname AS function_name,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_can_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prosecdef=true
ORDER BY p.proname;

-- Do NOT enter service_role/secret keys in the browser or GitHub.
-- Important limit: user_progress, practice_events and CLI mission passes are
-- client-reported formative events. Teacher evaluation scores are server-graded,
-- but the current practice workflow allows retries and reveals answer keys after submitting.
