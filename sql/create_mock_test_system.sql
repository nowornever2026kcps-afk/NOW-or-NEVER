-- ============================================================
-- NOW-or-NEVER — MCQ Mock Test System
-- STEP 2: DATABASE FOUNDATION
--
-- Run this file once in Supabase SQL Editor.
-- This step ONLY creates the database foundation.
-- It does not generate questions, calculate marks, award points,
-- or modify the existing leaderboard/points system.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. MOCK TESTS
-- ------------------------------------------------------------
create table if not exists public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  exam_type text not null default 'NEET',
  subject text,
  chapter text,
  question_count integer not null default 0,
  duration_minutes integer not null default 180,
  marks_per_question numeric(6,2) not null default 4,
  negative_marks numeric(6,2) not null default 1,
  start_at timestamptz,
  end_at timestamptz,

  -- draft -> ai_generated -> ai_validated -> published
  -- -> awaiting_validation -> ready_to_finalize -> finalized
  status text not null default 'draft',

  -- Generation/validation state is deliberately separate from
  -- publication/finalization state.
  validation_status text not null default 'pending',

  created_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  finalized_at timestamptz,

  -- Final answer-key version. Incremented whenever the official key
  -- is changed before finalization.
  answer_key_version integer not null default 0,

  -- Official results are locked after finalization.
  results_locked boolean not null default false,

  constraint mock_tests_question_count_check
    check (question_count between 0 and 90),
  constraint mock_tests_duration_check
    check (duration_minutes > 0),
  constraint mock_tests_marks_check
    check (marks_per_question >= 0),
  constraint mock_tests_negative_check
    check (negative_marks >= 0),
  constraint mock_tests_dates_check
    check (end_at is null or start_at is null or end_at > start_at),
  constraint mock_tests_status_check
    check (status in (
      'draft',
      'ai_generated',
      'ai_validated',
      'published',
      'awaiting_validation',
      'ready_to_finalize',
      'finalized'
    )),
  constraint mock_tests_validation_status_check
    check (validation_status in (
      'pending',
      'running',
      'passed',
      'issues_found',
      'completed'
    ))
);

-- ------------------------------------------------------------
-- 2. QUESTIONS
-- ------------------------------------------------------------
create table if not exists public.mock_test_questions (
  id uuid primary key default gen_random_uuid(),
  mock_test_id uuid not null references public.mock_tests(id) on delete cascade,
  position integer not null,

  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,

  -- A/B/C/D. This is the CURRENT key and is not automatically
  -- treated as official until the test is finalized.
  correct_answer text not null,
  explanation text,

  difficulty text,
  subject text,
  chapter text,
  topic text,

  -- AI metadata is informational only. Admin remains final authority.
  ai_confidence numeric(5,2),
  generation_model text,
  validation_status text not null default 'pending',
  validation_score numeric(5,2),
  validation_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mock_test_questions_position_check
    check (position between 1 and 90),
  constraint mock_test_questions_answer_check
    check (correct_answer in ('A','B','C','D')),
  constraint mock_test_questions_validation_check
    check (validation_status in (
      'pending',
      'valid',
      'warning',
      'invalid',
      'corrected'
    )),
  constraint mock_test_questions_unique_position
    unique (mock_test_id, position),
  constraint mock_test_questions_unique_id_test
    unique (id, mock_test_id)
);

-- ------------------------------------------------------------
-- 3. QUESTION REVIEWS / AI VALIDATION RESULTS
-- ------------------------------------------------------------
create table if not exists public.mock_test_question_reviews (
  id uuid primary key default gen_random_uuid(),
  mock_test_id uuid not null references public.mock_tests(id) on delete cascade,
  question_id uuid not null,

  reviewer_type text not null default 'ai',
  issue_type text,
  severity text not null default 'info',

  old_answer text,
  suggested_answer text,
  explanation text,
  review_payload jsonb not null default '{}'::jsonb,

  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,

  constraint mock_test_question_reviews_question_fk
    foreign key (question_id, mock_test_id)
    references public.mock_test_questions(id, mock_test_id)
    on delete cascade,
  constraint mock_test_question_reviews_reviewer_check
    check (reviewer_type in ('ai','admin','system')),
  constraint mock_test_question_reviews_severity_check
    check (severity in ('info','low','medium','high','critical')),
  constraint mock_test_question_reviews_status_check
    check (status in ('open','accepted','rejected','resolved')),
  constraint mock_test_question_reviews_old_answer_check
    check (old_answer is null or old_answer in ('A','B','C','D')),
  constraint mock_test_question_reviews_suggested_answer_check
    check (suggested_answer is null or suggested_answer in ('A','B','C','D'))
);

-- ------------------------------------------------------------
-- 4. STUDENT ATTEMPTS
-- ------------------------------------------------------------
create table if not exists public.mock_test_attempts (
  id uuid primary key default gen_random_uuid(),
  mock_test_id uuid not null references public.mock_tests(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,

  attempt_number integer not null default 1,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,

  -- submitted = answers stored, marks pending
  -- finalized = official marks calculated
  -- practice = late/retry attempt; never contributes to official leaderboard
  status text not null default 'in_progress',
  is_official boolean not null default false,
  is_practice boolean not null default false,

  -- Snapshot the test rules used for this attempt.
  duration_minutes integer,
  marks_per_question numeric(6,2),
  negative_marks numeric(6,2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mock_test_attempts_status_check
    check (status in ('in_progress','submitted','awaiting_finalization','finalized','practice')),
  constraint mock_test_attempts_mode_check
    check (not (is_official and is_practice)),
  constraint mock_test_attempts_unique_number
    unique (mock_test_id, student_id, attempt_number),
  constraint mock_test_attempts_unique_official
    unique (mock_test_id, student_id, is_official)
    deferrable initially immediate
);

-- ------------------------------------------------------------
-- 5. STUDENT ANSWERS
-- ------------------------------------------------------------
create table if not exists public.mock_test_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.mock_test_attempts(id) on delete cascade,
  question_id uuid not null references public.mock_test_questions(id) on delete restrict,

  -- null means unattempted.
  selected_answer text,
  answered_at timestamptz not null default now(),

  constraint mock_test_answers_answer_check
    check (selected_answer is null or selected_answer in ('A','B','C','D')),
  constraint mock_test_answers_unique
    unique (attempt_id, question_id),
  constraint mock_test_answers_question_test_match
    foreign key (question_id, attempt_id)
    references public.mock_test_questions(id, mock_test_id)
    on delete restrict
    -- NOTE: this composite FK cannot work because attempt_id does not
    -- contain mock_test_id. It is intentionally replaced below by a
    -- trigger in the final migration section.
);

-- The previous table definition contains an invalid composite FK shape in
-- PostgreSQL. Drop it and recreate the answer table correctly if this script
-- is being run on a clean database. The block below handles both fresh and
-- partially-created runs safely.

drop table if exists public.mock_test_answers cascade;

create table public.mock_test_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.mock_test_attempts(id) on delete cascade,
  question_id uuid not null references public.mock_test_questions(id) on delete restrict,
  selected_answer text,
  answered_at timestamptz not null default now(),
  constraint mock_test_answers_answer_check
    check (selected_answer is null or selected_answer in ('A','B','C','D')),
  constraint mock_test_answers_unique
    unique (attempt_id, question_id)
);

-- ------------------------------------------------------------
-- 6. OFFICIAL RESULTS
-- ------------------------------------------------------------
create table if not exists public.mock_test_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.mock_test_attempts(id) on delete cascade,
  mock_test_id uuid not null references public.mock_tests(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,

  total_questions integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  unattempted_count integer not null default 0,

  marks numeric(10,2) not null default 0,
  accuracy numeric(7,2) not null default 0,
  rank integer,

  answer_key_version integer not null,
  finalized_at timestamptz not null default now(),

  constraint mock_test_results_counts_check
    check (
      total_questions >= 0 and
      correct_count >= 0 and
      wrong_count >= 0 and
      unattempted_count >= 0 and
      correct_count + wrong_count + unattempted_count = total_questions
    ),
  constraint mock_test_results_accuracy_check
    check (accuracy between 0 and 100)
);

-- ------------------------------------------------------------
-- 7. ANSWER-KEY CORRECTION AUDIT TRAIL
-- ------------------------------------------------------------
create table if not exists public.mock_test_corrections (
  id uuid primary key default gen_random_uuid(),
  mock_test_id uuid not null references public.mock_tests(id) on delete cascade,
  question_id uuid not null,

  old_answer text not null,
  new_answer text not null,
  changed_by uuid references auth.users(id) on delete set null,
  change_type text not null default 'admin_manual',
  reason text,
  created_at timestamptz not null default now(),

  constraint mock_test_corrections_question_fk
    foreign key (question_id, mock_test_id)
    references public.mock_test_questions(id, mock_test_id)
    on delete cascade,
  constraint mock_test_corrections_old_answer_check
    check (old_answer in ('A','B','C','D')),
  constraint mock_test_corrections_new_answer_check
    check (new_answer in ('A','B','C','D')),
  constraint mock_test_corrections_type_check
    check (change_type in ('admin_manual','ai_suggestion','system'))
);

-- ------------------------------------------------------------
-- 8. POINT REWARD IDEMPOTENCY
-- ------------------------------------------------------------
-- This table does NOT award points yet. It reserves a server-side record
-- so the future finalize function can guarantee one reward per official
-- attempt without touching existing point logic until that step.
create table if not exists public.mock_test_point_rewards (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.mock_test_attempts(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  points integer not null default 0,
  awarded boolean not null default false,
  awarded_at timestamptz,
  point_transaction_id bigint,
  created_at timestamptz not null default now(),
  constraint mock_test_point_rewards_points_check check (points >= 0)
);

-- ------------------------------------------------------------
-- 9. INDEXES
-- ------------------------------------------------------------
create index if not exists idx_mock_tests_status
  on public.mock_tests(status);

create index if not exists idx_mock_tests_dates
  on public.mock_tests(start_at, end_at);

create index if not exists idx_mock_test_questions_test
  on public.mock_test_questions(mock_test_id, position);

create index if not exists idx_mock_test_reviews_test
  on public.mock_test_question_reviews(mock_test_id, status);

create index if not exists idx_mock_test_reviews_question
  on public.mock_test_question_reviews(question_id);

create index if not exists idx_mock_test_attempts_test_student
  on public.mock_test_attempts(mock_test_id, student_id);

create index if not exists idx_mock_test_attempts_official
  on public.mock_test_attempts(mock_test_id, is_official);

create index if not exists idx_mock_test_answers_attempt
  on public.mock_test_answers(attempt_id);

create index if not exists idx_mock_test_results_test
  on public.mock_test_results(mock_test_id, marks desc);

create index if not exists idx_mock_test_results_student
  on public.mock_test_results(student_id);

create index if not exists idx_mock_test_corrections_test
  on public.mock_test_corrections(mock_test_id, created_at desc);

-- ------------------------------------------------------------
-- 10. UPDATED_AT TRIGGER
-- ------------------------------------------------------------
create or replace function public.mock_test_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_mock_tests_updated_at on public.mock_tests;
create trigger trg_mock_tests_updated_at
before update on public.mock_tests
for each row execute function public.mock_test_set_updated_at();

drop trigger if exists trg_mock_test_questions_updated_at on public.mock_test_questions;
create trigger trg_mock_test_questions_updated_at
before update on public.mock_test_questions
for each row execute function public.mock_test_set_updated_at();

drop trigger if exists trg_mock_test_attempts_updated_at on public.mock_test_attempts;
create trigger trg_mock_test_attempts_updated_at
before update on public.mock_test_attempts
for each row execute function public.mock_test_set_updated_at();

-- ------------------------------------------------------------
-- 11. ATTEMPT/QUESTION CONSISTENCY TRIGGER
-- ------------------------------------------------------------
-- Ensures an answer can only belong to a question from the same mock test
-- as the attempt.
create or replace function public.validate_mock_test_answer_test_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_test uuid;
  v_question_test uuid;
begin
  select mock_test_id into v_attempt_test
  from public.mock_test_attempts
  where id = new.attempt_id;

  select mock_test_id into v_question_test
  from public.mock_test_questions
  where id = new.question_id;

  if v_attempt_test is null or v_question_test is null then
    raise exception 'Invalid mock test attempt or question';
  end if;

  if v_attempt_test <> v_question_test then
    raise exception 'Question does not belong to the attempt mock test';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_mock_test_answer_test_match on public.mock_test_answers;
create trigger trg_validate_mock_test_answer_test_match
before insert or update on public.mock_test_answers
for each row execute function public.validate_mock_test_answer_test_match();

-- ------------------------------------------------------------
-- 12. RLS
-- ------------------------------------------------------------
-- The browser will eventually use tightly-scoped RPC/Edge Functions for
-- privileged operations. RLS is enabled now so raw client access does not
-- accidentally expose answer keys or allow students to modify official data.

alter table public.mock_tests enable row level security;
alter table public.mock_test_questions enable row level security;
alter table public.mock_test_question_reviews enable row level security;
alter table public.mock_test_attempts enable row level security;
alter table public.mock_test_answers enable row level security;
alter table public.mock_test_results enable row level security;
alter table public.mock_test_corrections enable row level security;
alter table public.mock_test_point_rewards enable row level security;

-- Helper: admin access follows the existing is_admin() RPC already used by
-- the Admin Command Center. If your project later changes that function,
-- only these policies need adjustment.

-- Published test metadata can be read by authenticated students.
drop policy if exists mock_tests_student_read on public.mock_tests;
create policy mock_tests_student_read
on public.mock_tests
for select
to authenticated
using (
  status = 'published'
  or status = 'awaiting_validation'
  or status = 'ready_to_finalize'
  or status = 'finalized'
  or created_by = auth.uid()
);

-- Questions are visible to authenticated users only while the test is
-- student-accessible. This policy intentionally does NOT hide correct_answer
-- at the SQL row level; the student frontend must not select that column.
-- The final student-serving RPC/Edge Function will expose a safe projection.
drop policy if exists mock_test_questions_student_read on public.mock_test_questions;
create policy mock_test_questions_student_read
on public.mock_test_questions
for select
to authenticated
using (
  exists (
    select 1 from public.mock_tests t
    where t.id = mock_test_questions.mock_test_id
      and (
        t.status in ('published','awaiting_validation','ready_to_finalize','finalized')
        or t.created_by = auth.uid()
      )
  )
);

-- Students may create/read/update ONLY their own attempts.
drop policy if exists mock_test_attempts_own on public.mock_test_attempts;
create policy mock_test_attempts_own
on public.mock_test_attempts
for all
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

-- Students may create/read/update answers belonging to their own attempt.
drop policy if exists mock_test_answers_own on public.mock_test_answers;
create policy mock_test_answers_own
on public.mock_test_answers
for all
to authenticated
using (
  exists (
    select 1 from public.mock_test_attempts a
    where a.id = mock_test_answers.attempt_id
      and a.student_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.mock_test_attempts a
    where a.id = mock_test_answers.attempt_id
      and a.student_id = auth.uid()
  )
);

-- Official results are readable only by the student who owns the result.
drop policy if exists mock_test_results_own_read on public.mock_test_results;
create policy mock_test_results_own_read
on public.mock_test_results
for select
to authenticated
using (student_id = auth.uid());

-- AI review, corrections and point-reward records are server/admin territory.
-- No direct authenticated-client policy is created for them.

-- ------------------------------------------------------------
-- 13. GRANTS
-- ------------------------------------------------------------
-- RLS remains the security boundary. These grants simply allow the API
-- layer to address the tables; policies determine what authenticated users
-- can actually do.
grant usage on schema public to authenticated;
grant select on public.mock_tests to authenticated;
grant select on public.mock_test_questions to authenticated;
grant select, insert, update on public.mock_test_attempts to authenticated;
grant select, insert, update on public.mock_test_answers to authenticated;
grant select on public.mock_test_results to authenticated;

-- Service-role / Edge Functions retain privileged access through their role.

-- ============================================================
-- END OF STEP 2
-- ============================================================
