-- RoutingLab Sprint 7 — run AFTER Sprint 5 & Sprint 6 SQL and manual privilege fixes.
-- Data in practice_events is STUDENT-REPORTED FORMATIVE ACTIVITY, not verified examination grades.
BEGIN;
CREATE TABLE IF NOT EXISTS public.practice_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity text NOT NULL CHECK (activity IN ('materi','visualisasi','miniLab','troubleshooting','evaluasi','cliLab')),
  outcome text NOT NULL CHECK (outcome IN ('completed','passed','retry')),
  score integer CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 160),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS practice_events_user_time_idx ON public.practice_events(user_id, created_at DESC);
ALTER TABLE public.practice_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.practice_events FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON TABLE public.practice_events TO authenticated;
DROP POLICY IF EXISTS practice_events_self_read ON public.practice_events;
CREATE POLICY practice_events_self_read ON public.practice_events FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));
DROP POLICY IF EXISTS practice_events_self_insert ON public.practice_events;
CREATE POLICY practice_events_self_insert ON public.practice_events FOR INSERT TO authenticated
WITH CHECK (
 user_id = (select auth.uid())
 AND EXISTS(SELECT 1 FROM public.profiles WHERE id=(select auth.uid()) AND role='siswa')
);
-- Correct Sprint 5 updated_at semantics when a progress row is updated via upsert.
CREATE OR REPLACE FUNCTION public.touch_routinglab_progress_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS routinglab_progress_updated_at ON public.user_progress;
CREATE TRIGGER routinglab_progress_updated_at BEFORE UPDATE ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.touch_routinglab_progress_updated_at();

-- Only the logged-in teacher's classes. No direct teacher access to every student's records.
CREATE OR REPLACE FUNCTION public.teacher_progress_report(p_class_id uuid DEFAULT NULL)
RETURNS TABLE (
 student_id uuid, class_id uuid, class_name text, student_name text,
 progress_percent integer, cli_percent integer, completed_count integer,
 activity_count integer, last_activity_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='guru'
  ) THEN RAISE EXCEPTION 'Akses monitoring hanya untuk guru' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT m.user_id, c.id, c.name, p.full_name,
    round(up.total_percent::numeric / 5)::integer,
    up.cli_percent,
    up.completed_count,
    ev.event_count,
    nullif(greatest(coalesce(up.last_update, '-infinity'::timestamptz),
                    coalesce(ev.last_event, '-infinity'::timestamptz)), '-infinity'::timestamptz)
  FROM public.classes c
  JOIN public.class_memberships m ON m.class_id=c.id
  JOIN public.profiles p ON p.id=m.user_id
  LEFT JOIN LATERAL (
    SELECT coalesce(sum(CASE WHEN activity IN ('materi','visualisasi','miniLab','troubleshooting','evaluasi') THEN percent ELSE 0 END),0)::integer AS total_percent,
      coalesce(max(CASE WHEN activity='cliLab' THEN percent ELSE NULL END),0)::integer AS cli_percent,
      count(*) FILTER (WHERE activity IN ('materi','visualisasi','miniLab','troubleshooting','evaluasi') AND percent=100)::integer AS completed_count,
      max(updated_at) AS last_update
    FROM public.user_progress WHERE user_id=m.user_id
  ) up ON TRUE
  LEFT JOIN LATERAL (
    SELECT count(*)::integer AS event_count, max(created_at) AS last_event
    FROM public.practice_events WHERE user_id=m.user_id
  ) ev ON TRUE
  WHERE c.teacher_id=auth.uid() AND (p_class_id IS NULL OR c.id=p_class_id)
  ORDER BY c.name, p.full_name, m.user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.teacher_progress_report(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.teacher_progress_report(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.teacher_recent_events(p_class_id uuid DEFAULT NULL, p_limit integer DEFAULT 20)
RETURNS TABLE (
 class_id uuid, class_name text, student_name text, activity text,
 outcome text, score integer, note text, created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='guru'
  ) THEN RAISE EXCEPTION 'Akses riwayat hanya untuk guru' USING ERRCODE='42501'; END IF;
  RETURN QUERY
    SELECT c.id,c.name,p.full_name,e.activity,e.outcome,e.score,e.note,e.created_at
    FROM public.classes c
    JOIN public.class_memberships m ON m.class_id=c.id
    JOIN public.profiles p ON p.id=m.user_id
    JOIN public.practice_events e ON e.user_id=m.user_id
    WHERE c.teacher_id=auth.uid() AND (p_class_id IS NULL OR c.id=p_class_id)
    ORDER BY e.created_at DESC,e.id DESC
    LIMIT least(greatest(coalesce(p_limit,20),1),50);
END;
$$;
REVOKE ALL ON FUNCTION public.teacher_recent_events(uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.teacher_recent_events(uuid,integer) TO authenticated;
COMMIT;
