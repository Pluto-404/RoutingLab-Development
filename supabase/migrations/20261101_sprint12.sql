-- RoutingLab Sprint 12: scoped teacher analytics and access hardening.
-- Apply in Supabase SQL Editor AFTER Sprint 11. Idempotent; no data resets.
-- All percentage progress and CLI mission results remain formative/client-reported.
BEGIN;

-- Defense in depth: keep every sensitive table protected by RLS.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_attempts ENABLE ROW LEVEL SECURITY;

-- No browser-side profile promotion, class writes or grading table writes.
REVOKE ALL ON TABLE public.profiles,public.classes,public.class_memberships FROM anon;
REVOKE INSERT,UPDATE,DELETE ON TABLE public.profiles,public.classes,public.class_memberships FROM authenticated;
REVOKE ALL ON TABLE public.user_progress,public.practice_events FROM anon;
REVOKE DELETE ON TABLE public.user_progress,public.practice_events FROM authenticated;
REVOKE UPDATE ON TABLE public.practice_events FROM authenticated;
REVOKE ALL ON TABLE public.mission_catalog,public.class_assignments,public.mission_attempts,
 public.evaluation_sets,public.evaluation_questions,public.evaluation_assignments,public.evaluation_attempts
 FROM PUBLIC,anon,authenticated;

-- Only students may edit their own FORMATIVE progress; teacher role cannot write it.
DROP POLICY IF EXISTS progress_self_update ON public.user_progress;
CREATE POLICY progress_self_update ON public.user_progress FOR UPDATE TO authenticated
 USING (user_id=(select auth.uid()) AND EXISTS(
  SELECT 1 FROM public.profiles p WHERE p.id=(select auth.uid()) AND p.role='siswa'))
 WITH CHECK (user_id=(select auth.uid()) AND EXISTS(
  SELECT 1 FROM public.profiles p WHERE p.id=(select auth.uid()) AND p.role='siswa'));

-- Teacher-only, class-scoped evaluation aggregates; best score per student/assignment.
CREATE OR REPLACE FUNCTION public.teacher_evaluation_summary(p_class_id uuid DEFAULT NULL)
RETURNS TABLE (
 assignment_id uuid, class_id uuid, class_name text, evaluation_title text,
 total_students integer, submitted_students integer, pending_students integer,
 average_score numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='guru'
 ) THEN RAISE EXCEPTION 'Akses monitoring hanya untuk guru' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT a.id,c.id,c.name,e.title,
  COUNT(cm.user_id)::integer,
  COUNT(best.score)::integer,
  (COUNT(cm.user_id)-COUNT(best.score))::integer,
  ROUND(AVG(best.score)::numeric,1)
 FROM public.evaluation_assignments a
 JOIN public.classes c ON c.id=a.class_id
 JOIN public.evaluation_sets e ON e.id=a.evaluation_id
 LEFT JOIN public.class_memberships cm ON cm.class_id=c.id
 LEFT JOIN LATERAL (
   SELECT MAX(t.score) AS score FROM public.evaluation_attempts t
   WHERE t.assignment_id=a.id AND t.student_id=cm.user_id
 ) best ON true
 WHERE c.teacher_id=auth.uid() AND e.teacher_id=auth.uid()
  AND a.is_active=true AND (p_class_id IS NULL OR c.id=p_class_id)
 GROUP BY a.id,c.id,c.name,e.title,a.assigned_at
 ORDER BY a.assigned_at DESC,c.name,e.title;
END $$;

-- Teacher-only activity breakdown. No client can choose another teacher or bypass class scope.
CREATE OR REPLACE FUNCTION public.teacher_activity_breakdown(p_class_id uuid DEFAULT NULL)
RETURNS TABLE (
 student_id uuid, class_id uuid, class_name text, student_name text,
 materi integer, visualisasi integer, mini_lab integer,
 troubleshooting integer, evaluasi integer, cli_lab integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='guru'
 ) THEN RAISE EXCEPTION 'Akses monitoring hanya untuk guru' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT cm.user_id,c.id,c.name,p.full_name,
  COALESCE(MAX(up.percent) FILTER (WHERE up.activity='materi'),0)::integer,
  COALESCE(MAX(up.percent) FILTER (WHERE up.activity='visualisasi'),0)::integer,
  COALESCE(MAX(up.percent) FILTER (WHERE up.activity='miniLab'),0)::integer,
  COALESCE(MAX(up.percent) FILTER (WHERE up.activity='troubleshooting'),0)::integer,
  COALESCE(MAX(up.percent) FILTER (WHERE up.activity='evaluasi'),0)::integer,
  COALESCE(MAX(up.percent) FILTER (WHERE up.activity='cliLab'),0)::integer
 FROM public.classes c
 JOIN public.class_memberships cm ON cm.class_id=c.id
 JOIN public.profiles p ON p.id=cm.user_id
 LEFT JOIN public.user_progress up ON up.user_id=cm.user_id
 WHERE c.teacher_id=auth.uid() AND (p_class_id IS NULL OR c.id=p_class_id)
 GROUP BY cm.user_id,c.id,c.name,p.full_name
 ORDER BY c.name,p.full_name,cm.user_id;
END $$;

-- Do not inherit executable rights for SECURITY DEFINER analytics via PUBLIC.
REVOKE ALL ON FUNCTION public.teacher_evaluation_summary(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.teacher_activity_breakdown(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.teacher_evaluation_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_activity_breakdown(uuid) TO authenticated;

-- Harden trigger helpers against unnecessary direct RPC invocation.
REVOKE ALL ON FUNCTION public.create_profile_on_signup() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.touch_routinglab_progress_updated_at() FROM PUBLIC,anon,authenticated;
COMMIT;
