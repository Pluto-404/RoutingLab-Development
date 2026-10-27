-- RoutingLab Sprint 6. Run ONCE after Sprint 5 migration and the manual fixes already applied.
-- Do not expose unrestricted teacher roster tables; this function limits results to auth.uid()'s classes.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON TABLE public.profiles, public.classes, public.class_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_progress TO authenticated;
-- Existing RLS policies from Sprint 5 remain enabled; do not disable RLS.
CREATE OR REPLACE FUNCTION public.teacher_dashboard()
RETURNS TABLE(student_id uuid, class_name text, student_name text, progress_percent integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS(
    SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='guru'
  ) THEN
    RAISE EXCEPTION 'Hanya guru yang dapat melihat monitoring kelas' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
    SELECT m.user_id, c.name, p.full_name,
      (ROUND(COALESCE(SUM(up.percent) FILTER (
        WHERE up.activity IN ('materi','visualisasi','miniLab','troubleshooting','evaluasi')
      ),0)::numeric / 5))::integer AS progress_percent
    FROM public.classes c
    INNER JOIN public.class_memberships m ON m.class_id=c.id
    INNER JOIN public.profiles p ON p.id=m.user_id
    LEFT JOIN public.user_progress up ON up.user_id=m.user_id
    WHERE c.teacher_id=auth.uid()
    GROUP BY m.user_id,c.id,c.name,p.full_name
    ORDER BY c.name,p.full_name;
END;
$$;
REVOKE ALL ON FUNCTION public.teacher_dashboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.teacher_dashboard() TO authenticated;
-- Note: this yields self-reported exercise progress, not verified grades.
