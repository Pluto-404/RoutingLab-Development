-- RoutingLab Sprint 8: Classroom CLI Missions (apply AFTER Sprint 5-7).
-- Mission attempts are formative, CLIENT-REPORTED and NOT verified exam grades.
-- No anonymous access, no direct client writes to assignments/attempts.
BEGIN;

CREATE TABLE IF NOT EXISTS public.mission_catalog (
  code text PRIMARY KEY CHECK (length(code) BETWEEN 3 AND 48),
  title text NOT NULL CHECK (length(title) BETWEEN 3 AND 100),
  description text NOT NULL CHECK (length(description) <= 500),
  scenario text NOT NULL CHECK (scenario IN ('empty','missing-return','wan-down','wrong-next-hop')),
  sort_order integer NOT NULL DEFAULT 0
);
INSERT INTO public.mission_catalog(code,title,description,scenario,sort_order) VALUES
 ('static-basic','Static Routing Dasar','Konfigurasikan rute dua arah antara LAN1 dan LAN2 dari awal.','empty',1),
 ('missing-return','Missing Return Route','Telusuri paket yang gagal kembali dan perbaiki konfigurasi rute balik.','missing-return',2),
 ('wan-down','WAN Shutdown','Identifikasi interface WAN yang nonaktif dan pulihkan koneksi antarjaringan.','wan-down',3),
 ('wrong-next-hop','Wrong Next Hop','Temukan alamat next hop yang keliru dan perbaiki jalur menuju LAN2.','wrong-next-hop',4)
ON CONFLICT (code) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description,
 scenario=EXCLUDED.scenario, sort_order=EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.class_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  mission_code text NOT NULL REFERENCES public.mission_catalog(code),
  assigned_by uuid NOT NULL REFERENCES public.profiles(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (class_id, mission_code)
);
CREATE INDEX IF NOT EXISTS class_assignments_class_idx ON public.class_assignments(class_id,is_active);

CREATE TABLE IF NOT EXISTS public.mission_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.class_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  outcome text NOT NULL CHECK (outcome IN ('passed','retry')),
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds BETWEEN 0 AND 21600),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mission_attempts_assignment_student_idx ON public.mission_attempts(assignment_id,student_id,created_at DESC);

ALTER TABLE public.mission_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mission_catalog, public.class_assignments, public.mission_attempts FROM PUBLIC,anon,authenticated;
-- All access goes through carefully scoped SECURITY DEFINER RPCs below; no generic table policies.

CREATE OR REPLACE FUNCTION public.list_missions()
RETURNS TABLE(code text,title text,description text,scenario text,sort_order integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('guru','siswa'))
 THEN RAISE EXCEPTION 'Login diperlukan' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT m.code,m.title,m.description,m.scenario,m.sort_order FROM public.mission_catalog m ORDER BY m.sort_order,m.code;
END $$;

CREATE OR REPLACE FUNCTION public.teacher_assign_mission(p_class_id uuid,p_mission_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE new_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (
   SELECT 1 FROM public.classes c JOIN public.profiles p ON p.id=c.teacher_id
   WHERE c.id=p_class_id AND c.teacher_id=auth.uid() AND p.role='guru'
 ) THEN RAISE EXCEPTION 'Kelas bukan milik guru' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.mission_catalog m WHERE m.code=p_mission_code)
 THEN RAISE EXCEPTION 'Misi tidak ditemukan'; END IF;
 INSERT INTO public.class_assignments(class_id,mission_code,assigned_by)
 VALUES(p_class_id,p_mission_code,auth.uid())
 ON CONFLICT (class_id,mission_code) DO UPDATE SET is_active=true, assigned_at=now(), assigned_by=EXCLUDED.assigned_by
 RETURNING id INTO new_id;
 RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.teacher_unassign_mission(p_assignment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='guru')
 THEN RAISE EXCEPTION 'Hanya guru yang dapat mengubah tugas' USING ERRCODE='42501'; END IF;
 UPDATE public.class_assignments a SET is_active=false
 WHERE a.id=p_assignment_id AND EXISTS (
  SELECT 1 FROM public.classes c WHERE c.id=a.class_id AND c.teacher_id=auth.uid()
 );
 IF NOT FOUND THEN RAISE EXCEPTION 'Penugasan tidak ditemukan atau bukan milik Anda' USING ERRCODE='42501'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.student_mission_board()
RETURNS TABLE(assignment_id uuid,class_id uuid,class_name text,mission_code text,
 mission_title text,mission_description text,scenario text,assigned_at timestamptz,
 attempt_count integer,passed boolean,last_attempt_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='siswa')
 THEN RAISE EXCEPTION 'Hanya siswa yang dapat melihat tugas' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT a.id,c.id,c.name,m.code,m.title,m.description,m.scenario,a.assigned_at,
        coalesce(s.count,0),coalesce(s.has_passed,false),s.last_time
 FROM public.class_memberships cm
 JOIN public.classes c ON c.id=cm.class_id
 JOIN public.class_assignments a ON a.class_id=c.id AND a.is_active=true
 JOIN public.mission_catalog m ON m.code=a.mission_code
 LEFT JOIN LATERAL (
   SELECT count(*)::integer AS count,bool_or(t.outcome='passed') AS has_passed,max(t.created_at) AS last_time
   FROM public.mission_attempts t WHERE t.assignment_id=a.id AND t.student_id=auth.uid()
 ) s ON true
 WHERE cm.user_id=auth.uid()
 ORDER BY a.assigned_at DESC,c.name,m.sort_order;
END $$;

CREATE OR REPLACE FUNCTION public.student_submit_mission_attempt(
 p_assignment_id uuid,p_outcome text,p_duration_seconds integer DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE new_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='siswa')
 THEN RAISE EXCEPTION 'Hanya siswa yang dapat menyimpan percobaan' USING ERRCODE='42501'; END IF;
 IF p_outcome IS NULL OR p_outcome NOT IN ('passed','retry') THEN RAISE EXCEPTION 'Hasil percobaan tidak valid'; END IF;
 IF p_duration_seconds IS NOT NULL AND (p_duration_seconds < 0 OR p_duration_seconds > 21600)
 THEN RAISE EXCEPTION 'Durasi percobaan tidak valid'; END IF;
 IF NOT EXISTS (
   SELECT 1 FROM public.class_assignments a
   JOIN public.class_memberships cm ON cm.class_id=a.class_id AND cm.user_id=auth.uid()
   WHERE a.id=p_assignment_id AND a.is_active=true
 ) THEN RAISE EXCEPTION 'Misi tidak aktif atau bukan kelas Anda' USING ERRCODE='42501'; END IF;
 INSERT INTO public.mission_attempts(assignment_id,student_id,outcome,duration_seconds)
 VALUES(p_assignment_id,auth.uid(),p_outcome,p_duration_seconds) RETURNING id INTO new_id;
 RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.teacher_mission_report(p_class_id uuid DEFAULT NULL)
RETURNS TABLE(assignment_id uuid,class_id uuid,class_name text,mission_code text,
 mission_title text,is_active boolean,assigned_at timestamptz,
 total_students integer,started_students integer,completed_students integer,attempts_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='guru')
 THEN RAISE EXCEPTION 'Akses laporan hanya untuk guru' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT a.id,c.id,c.name,m.code,m.title,a.is_active,a.assigned_at,
  (SELECT count(*)::integer FROM public.class_memberships cm WHERE cm.class_id=c.id),
  (SELECT count(DISTINCT t.student_id)::integer FROM public.mission_attempts t
    JOIN public.class_memberships cm ON cm.class_id=c.id AND cm.user_id=t.student_id WHERE t.assignment_id=a.id),
  (SELECT count(DISTINCT t.student_id)::integer FROM public.mission_attempts t
    JOIN public.class_memberships cm ON cm.class_id=c.id AND cm.user_id=t.student_id
    WHERE t.assignment_id=a.id AND t.outcome='passed'),
  (SELECT count(*)::integer FROM public.mission_attempts t
    JOIN public.class_memberships cm ON cm.class_id=c.id AND cm.user_id=t.student_id WHERE t.assignment_id=a.id)
 FROM public.class_assignments a
 JOIN public.classes c ON c.id=a.class_id
 JOIN public.mission_catalog m ON m.code=a.mission_code
 WHERE c.teacher_id=auth.uid() AND (p_class_id IS NULL OR c.id=p_class_id)
 ORDER BY a.is_active DESC,c.name,m.sort_order;
END $$;

CREATE OR REPLACE FUNCTION public.teacher_mission_attempts(p_class_id uuid DEFAULT NULL,p_limit integer DEFAULT 30)
RETURNS TABLE(class_name text,student_name text,mission_title text,outcome text,
 duration_seconds integer,created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='guru')
 THEN RAISE EXCEPTION 'Akses riwayat hanya untuk guru' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT c.name,p.full_name,m.title,t.outcome,t.duration_seconds,t.created_at
 FROM public.mission_attempts t
 JOIN public.class_assignments a ON a.id=t.assignment_id
 JOIN public.classes c ON c.id=a.class_id
 JOIN public.class_memberships cm ON cm.class_id=c.id AND cm.user_id=t.student_id
 JOIN public.profiles p ON p.id=t.student_id
 JOIN public.mission_catalog m ON m.code=a.mission_code
 WHERE c.teacher_id=auth.uid() AND (p_class_id IS NULL OR c.id=p_class_id)
 ORDER BY t.created_at DESC,t.id DESC
 LIMIT least(greatest(coalesce(p_limit,30),1),100);
END $$;

REVOKE ALL ON FUNCTION public.list_missions() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.teacher_assign_mission(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.teacher_unassign_mission(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.student_mission_board() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.student_submit_mission_attempt(uuid,text,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.teacher_mission_report(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.teacher_mission_attempts(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_missions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_assign_mission(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_unassign_mission(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.student_mission_board() TO authenticated;
GRANT EXECUTE ON FUNCTION public.student_submit_mission_attempt(uuid,text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_mission_report(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_mission_attempts(uuid,integer) TO authenticated;
COMMIT;
