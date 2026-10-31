-- RoutingLab Sprint 11 — Teacher evaluations and server-graded formative attempts.
-- Run once (safe to re-run) in Supabase SQL Editor as the project administrator.
-- No existing tables, progress, users, or mission attempts are deleted.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.evaluation_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evaluation_sets_teacher_idx ON public.evaluation_sets(teacher_id);
CREATE TABLE IF NOT EXISTS public.evaluation_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluation_sets(id) ON DELETE CASCADE,
  question_text text NOT NULL CHECK (char_length(question_text) BETWEEN 5 AND 1000),
  options jsonb NOT NULL CHECK (jsonb_typeof(options)='array' AND jsonb_array_length(options)=4),
  correct_index integer NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation text NOT NULL DEFAULT '' CHECK (char_length(explanation)<=1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evaluation_questions_set_idx ON public.evaluation_questions(evaluation_id,created_at,id);
CREATE TABLE IF NOT EXISTS public.evaluation_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluation_sets(id),
  class_id uuid NOT NULL REFERENCES public.classes(id),
  is_active boolean NOT NULL DEFAULT true,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(evaluation_id,class_id)
);
CREATE INDEX IF NOT EXISTS evaluation_assignments_class_idx ON public.evaluation_assignments(class_id,is_active);
CREATE TABLE IF NOT EXISTS public.evaluation_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.evaluation_assignments(id),
  student_id uuid NOT NULL REFERENCES public.profiles(id),
  answers jsonb NOT NULL,
  correct_count integer NOT NULL,
  question_count integer NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evaluation_attempts_student_idx ON public.evaluation_attempts(assignment_id,student_id,submitted_at DESC);

ALTER TABLE public.evaluation_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.evaluation_sets,public.evaluation_questions,public.evaluation_assignments,public.evaluation_attempts FROM PUBLIC,anon,authenticated;
-- The browser never queries base tables. SECURITY DEFINER functions apply user/class scoping.

CREATE OR REPLACE FUNCTION public.teacher_evaluations()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='guru')
 THEN RAISE EXCEPTION 'Khusus guru' USING ERRCODE='42501'; END IF;
 RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object(
  'id',e.id,'title',e.title,'description',e.description,
  'question_count',(SELECT count(*) FROM public.evaluation_questions q WHERE q.evaluation_id=e.id),
  'assignment_count',(SELECT count(*) FROM public.evaluation_assignments a WHERE a.evaluation_id=e.id)
 ) ORDER BY e.created_at DESC) FROM public.evaluation_sets e WHERE e.teacher_id=auth.uid()),'[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.teacher_save_evaluation(p_evaluation_id uuid DEFAULT NULL,p_title text DEFAULT NULL,p_description text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE new_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='guru')
 THEN RAISE EXCEPTION 'Khusus guru' USING ERRCODE='42501'; END IF;
 IF char_length(btrim(coalesce(p_title,''))) NOT BETWEEN 3 AND 120 OR char_length(coalesce(p_description,''))>500
 THEN RAISE EXCEPTION 'Judul harus 3–120 karakter dan deskripsi maksimal 500 karakter'; END IF;
 IF p_evaluation_id IS NULL THEN
   INSERT INTO public.evaluation_sets(teacher_id,title,description)
   VALUES(auth.uid(),btrim(p_title),btrim(coalesce(p_description,''))) RETURNING id INTO new_id;
 ELSE
   UPDATE public.evaluation_sets SET title=btrim(p_title),description=btrim(coalesce(p_description,''))
   WHERE id=p_evaluation_id AND teacher_id=auth.uid() RETURNING id INTO new_id;
   IF new_id IS NULL THEN RAISE EXCEPTION 'Evaluasi bukan milik Anda' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.teacher_evaluation_questions(p_evaluation_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.evaluation_sets e WHERE e.id=p_evaluation_id AND e.teacher_id=auth.uid())
 THEN RAISE EXCEPTION 'Evaluasi bukan milik guru' USING ERRCODE='42501'; END IF;
 RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object(
 'id',q.id,'question_text',q.question_text,'options',q.options,'correct_index',q.correct_index,
 'explanation',q.explanation) ORDER BY q.created_at,q.id)
 FROM public.evaluation_questions q WHERE q.evaluation_id=p_evaluation_id),'[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.teacher_upsert_evaluation_question(
 p_evaluation_id uuid,p_question_id uuid DEFAULT NULL,p_question_text text DEFAULT NULL,
 p_options jsonb DEFAULT NULL,p_correct_index integer DEFAULT NULL,p_explanation text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE new_id uuid; item jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.evaluation_sets e WHERE e.id=p_evaluation_id AND e.teacher_id=auth.uid())
 THEN RAISE EXCEPTION 'Evaluasi bukan milik guru' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.evaluation_assignments a WHERE a.evaluation_id=p_evaluation_id)
 THEN RAISE EXCEPTION 'Soal terkunci setelah evaluasi pernah ditugaskan. Buat evaluasi baru untuk revisi.'; END IF;
 IF char_length(btrim(coalesce(p_question_text,''))) NOT BETWEEN 5 AND 1000
 OR jsonb_typeof(p_options) IS DISTINCT FROM 'array' OR jsonb_array_length(p_options)<>4
 OR p_correct_index NOT BETWEEN 0 AND 3 OR char_length(coalesce(p_explanation,''))>1000
 THEN RAISE EXCEPTION 'Soal, empat pilihan, kunci dan pembahasan harus valid'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_options) LOOP
   IF jsonb_typeof(item)<>'string' OR char_length(btrim(item #>> '{}')) NOT BETWEEN 1 AND 300
   THEN RAISE EXCEPTION 'Setiap pilihan harus berupa teks 1–300 karakter'; END IF;
 END LOOP;
 IF p_question_id IS NULL THEN
   IF (SELECT count(*) FROM public.evaluation_questions WHERE evaluation_id=p_evaluation_id)>=50
   THEN RAISE EXCEPTION 'Maksimal 50 soal per evaluasi'; END IF;
   INSERT INTO public.evaluation_questions(evaluation_id,question_text,options,correct_index,explanation)
   VALUES(p_evaluation_id,btrim(p_question_text),p_options,p_correct_index,btrim(coalesce(p_explanation,''))) RETURNING id INTO new_id;
 ELSE
   UPDATE public.evaluation_questions SET question_text=btrim(p_question_text),options=p_options,
   correct_index=p_correct_index,explanation=btrim(coalesce(p_explanation,''))
   WHERE id=p_question_id AND evaluation_id=p_evaluation_id RETURNING id INTO new_id;
   IF new_id IS NULL THEN RAISE EXCEPTION 'Soal tidak ditemukan'; END IF;
 END IF;
 RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.teacher_delete_evaluation_question(p_question_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 DELETE FROM public.evaluation_questions q WHERE q.id=p_question_id
 AND EXISTS(SELECT 1 FROM public.evaluation_sets e WHERE e.id=q.evaluation_id AND e.teacher_id=auth.uid())
 AND NOT EXISTS(SELECT 1 FROM public.evaluation_assignments a WHERE a.evaluation_id=q.evaluation_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Soal terkunci atau bukan milik Anda' USING ERRCODE='42501'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.teacher_delete_evaluation(p_evaluation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 DELETE FROM public.evaluation_sets e WHERE e.id=p_evaluation_id AND e.teacher_id=auth.uid()
 AND NOT EXISTS(SELECT 1 FROM public.evaluation_assignments a WHERE a.evaluation_id=e.id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Evaluasi sudah ditugaskan atau bukan milik Anda' USING ERRCODE='42501'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.teacher_set_evaluation_assignment(p_evaluation_id uuid,p_class_id uuid,p_active boolean DEFAULT true)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result_id uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.evaluation_sets e WHERE e.id=p_evaluation_id AND e.teacher_id=auth.uid())
 OR NOT EXISTS(SELECT 1 FROM public.classes c WHERE c.id=p_class_id AND c.teacher_id=auth.uid())
 THEN RAISE EXCEPTION 'Evaluasi dan kelas harus milik guru' USING ERRCODE='42501'; END IF;
 IF p_active IS TRUE AND NOT EXISTS(SELECT 1 FROM public.evaluation_questions q WHERE q.evaluation_id=p_evaluation_id)
 THEN RAISE EXCEPTION 'Tambahkan soal sebelum menugaskan evaluasi'; END IF;
 IF p_active IS TRUE THEN
   INSERT INTO public.evaluation_assignments(evaluation_id,class_id,is_active)
   VALUES(p_evaluation_id,p_class_id,true)
   ON CONFLICT(evaluation_id,class_id) DO UPDATE SET is_active=true,assigned_at=now()
   RETURNING id INTO result_id;
 ELSE
   UPDATE public.evaluation_assignments SET is_active=false
   WHERE evaluation_id=p_evaluation_id AND class_id=p_class_id RETURNING id INTO result_id;
   IF result_id IS NULL THEN RAISE EXCEPTION 'Penugasan belum ada'; END IF;
 END IF;
 RETURN result_id;
END $$;

CREATE OR REPLACE FUNCTION public.teacher_evaluation_assignments()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='guru')
 THEN RAISE EXCEPTION 'Khusus guru' USING ERRCODE='42501'; END IF;
 RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object(
  'id',a.id,'evaluation_id',a.evaluation_id,'title',e.title,'class_id',c.id,
  'class_name',c.name,'is_active',a.is_active,
  'attempts',(SELECT count(*) FROM public.evaluation_attempts t WHERE t.assignment_id=a.id)
 ) ORDER BY a.assigned_at DESC)
 FROM public.evaluation_assignments a
 JOIN public.evaluation_sets e ON e.id=a.evaluation_id
 JOIN public.classes c ON c.id=a.class_id WHERE e.teacher_id=auth.uid()),'[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.teacher_evaluation_results(p_class_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='guru')
 THEN RAISE EXCEPTION 'Khusus guru' USING ERRCODE='42501'; END IF;
 IF p_class_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.classes c WHERE c.id=p_class_id AND c.teacher_id=auth.uid())
 THEN RAISE EXCEPTION 'Kelas bukan milik guru' USING ERRCODE='42501'; END IF;
 RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object(
  'student_name',p.full_name,'class_name',c.name,'title',e.title,'score',t.score,
  'correct_count',t.correct_count,'question_count',t.question_count,'submitted_at',t.submitted_at
 ) ORDER BY t.submitted_at DESC)
 FROM public.evaluation_attempts t
 JOIN public.evaluation_assignments a ON a.id=t.assignment_id
 JOIN public.evaluation_sets e ON e.id=a.evaluation_id
 JOIN public.classes c ON c.id=a.class_id
 JOIN public.profiles p ON p.id=t.student_id
 JOIN public.class_memberships cm ON cm.class_id=c.id AND cm.user_id=t.student_id
 WHERE c.teacher_id=auth.uid() AND (p_class_id IS NULL OR c.id=p_class_id)
 AND e.teacher_id=auth.uid()
 ),'[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.student_evaluation_board()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='siswa')
 THEN RAISE EXCEPTION 'Khusus siswa' USING ERRCODE='42501'; END IF;
 RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object(
  'assignment_id',a.id,'title',e.title,'description',e.description,'class_name',c.name,
  'question_count',(SELECT count(*) FROM public.evaluation_questions q WHERE q.evaluation_id=e.id),
  'attempt_count',(SELECT count(*) FROM public.evaluation_attempts t WHERE t.assignment_id=a.id AND t.student_id=auth.uid()),
  'best_score',(SELECT max(t.score) FROM public.evaluation_attempts t WHERE t.assignment_id=a.id AND t.student_id=auth.uid())
 ) ORDER BY a.assigned_at DESC)
 FROM public.evaluation_assignments a
 JOIN public.evaluation_sets e ON e.id=a.evaluation_id
 JOIN public.classes c ON c.id=a.class_id
 JOIN public.class_memberships cm ON cm.class_id=c.id AND cm.user_id=auth.uid()
 WHERE a.is_active=true),'[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.student_evaluation_questions(p_assignment_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' STABLE AS $$
DECLARE evaluation_id uuid; result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='siswa')
 THEN RAISE EXCEPTION 'Khusus siswa' USING ERRCODE='42501'; END IF;
 SELECT a.evaluation_id INTO evaluation_id
 FROM public.evaluation_assignments a JOIN public.class_memberships cm ON cm.class_id=a.class_id
 WHERE a.id=p_assignment_id AND a.is_active=true AND cm.user_id=auth.uid();
 IF evaluation_id IS NULL THEN RAISE EXCEPTION 'Evaluasi tidak tersedia untuk kelasmu' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object('title',e.title,'questions',COALESCE((
   SELECT jsonb_agg(jsonb_build_object('id',q.id,'question_text',q.question_text,'options',q.options)
   ORDER BY q.created_at,q.id) FROM public.evaluation_questions q WHERE q.evaluation_id=e.id
 ),'[]'::jsonb)) INTO result FROM public.evaluation_sets e WHERE e.id=evaluation_id;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.student_submit_evaluation(p_assignment_id uuid,p_answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_eval_id uuid; total integer; correct integer:=0; selected integer; q record;
        review jsonb:='[]'::jsonb; result_score integer; uid uuid;
BEGIN
 uid:=auth.uid();
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=uid AND p.role='siswa')
 THEN RAISE EXCEPTION 'Khusus siswa' USING ERRCODE='42501'; END IF;
 SELECT a.evaluation_id INTO v_eval_id
 FROM public.evaluation_assignments a JOIN public.class_memberships cm ON cm.class_id=a.class_id
 WHERE a.id=p_assignment_id AND a.is_active=true AND cm.user_id=uid;
 IF v_eval_id IS NULL THEN RAISE EXCEPTION 'Evaluasi tidak tersedia untuk kelasmu' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_answers) IS DISTINCT FROM 'object'
 THEN RAISE EXCEPTION 'Format jawaban harus objek'; END IF;
 SELECT count(*) INTO total FROM public.evaluation_questions WHERE evaluation_id=v_eval_id;
 IF total<1 OR total>50 OR (SELECT count(*) FROM jsonb_object_keys(p_answers))<>total
 THEN RAISE EXCEPTION 'Semua soal harus dijawab sekali'; END IF;
 FOR q IN SELECT id,question_text,options,correct_index,explanation
          FROM public.evaluation_questions WHERE evaluation_id=v_eval_id ORDER BY created_at,id LOOP
   IF NOT p_answers ? (q.id::text) OR jsonb_typeof(p_answers->(q.id::text))<>'number'
   THEN RAISE EXCEPTION 'Jawaban tidak lengkap'; END IF;
   selected:=(p_answers->>(q.id::text))::integer;
   IF selected NOT BETWEEN 0 AND 3 OR (p_answers->>(q.id::text))<>selected::text
   THEN RAISE EXCEPTION 'Pilihan jawaban tidak valid'; END IF;
   IF selected=q.correct_index THEN correct:=correct+1; END IF;
   review:=review||jsonb_build_array(jsonb_build_object(
      'question_text',q.question_text,'selected',selected,'correct_index',q.correct_index,
      'correct_answer',q.options->>q.correct_index,'explanation',q.explanation,'is_correct',selected=q.correct_index));
 END LOOP;
 result_score:=round((correct::numeric/total)*100)::integer;
 INSERT INTO public.evaluation_attempts(assignment_id,student_id,answers,correct_count,question_count,score)
 VALUES(p_assignment_id,uid,p_answers,correct,total,result_score);
 RETURN jsonb_build_object('score',result_score,'correct_count',correct,'question_count',total,'review',review);
END $$;

-- Explicitly remove PUBLIC / anon execute privileges and allow only logged-in users.
DO $$
DECLARE rec record;
BEGIN
 FOR rec IN SELECT format('%I.%I(%s)',n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) AS signature
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN (
 'teacher_evaluations','teacher_save_evaluation','teacher_evaluation_questions',
 'teacher_upsert_evaluation_question','teacher_delete_evaluation_question','teacher_delete_evaluation',
 'teacher_set_evaluation_assignment','teacher_evaluation_assignments','teacher_evaluation_results',
 'student_evaluation_board','student_evaluation_questions','student_submit_evaluation') LOOP
   EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',rec.signature);
   EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',rec.signature);
 END LOOP;
END $$;
COMMIT;
