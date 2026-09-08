-- ============================================================
-- NOW-or-NEVER — NEET SYLLABUS BOUNDARY SYSTEM
-- Migration: add_neet_syllabus_system.sql
--
-- Purpose:
--   Store the official NEET-UG syllabus boundary separately from
--   the MCQ generator so AI cannot freely expand a chapter into
--   university-level/general scientific knowledge.
--
-- Source:
--   National Medical Commission (NMC), NEET (UG)-2026 syllabus,
--   finalized 22-12-2025 and published through NTA.
--
-- This migration is additive. It does NOT delete or modify existing
-- mock tests/questions/attempts.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. SYLLABUS SCOPE
-- ------------------------------------------------------------
create table if not exists public.neet_syllabus (
  id uuid primary key default gen_random_uuid(),

  exam_type text not null default 'NEET',
  exam_year integer not null,
  subject text not null,
  unit_code text not null,
  unit_name text not null,
  chapter text not null,

  -- Exact/near-exact official syllabus boundary for this scope.
  scope_text text not null,

  -- Optional explicit exclusions. These are NOT official syllabus text;
  -- they are safety boundaries used by the generator/validator.
  exclusions_text text,

  source_name text not null default 'National Medical Commission (NMC)',
  source_url text,
  source_date date,

  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint neet_syllabus_exam_year_check
    check (exam_year >= 2026),
  constraint neet_syllabus_subject_check
    check (subject in ('Physics','Chemistry','Biology')),
  constraint neet_syllabus_unique_scope
    unique (exam_year, subject, unit_code, chapter)
);

create index if not exists idx_neet_syllabus_lookup
  on public.neet_syllabus(exam_year, subject, unit_code, chapter, active);

-- ------------------------------------------------------------
-- 2. LINK A MOCK TEST TO THE EXACT SYLLABUS SCOPE USED
-- ------------------------------------------------------------
create table if not exists public.mock_test_syllabus_scope (
  id uuid primary key default gen_random_uuid(),
  mock_test_id uuid not null references public.mock_tests(id) on delete cascade,
  syllabus_id uuid not null references public.neet_syllabus(id) on delete restrict,

  -- Snapshot metadata so later syllabus updates do not silently change
  -- the boundary that was used to generate an existing test.
  exam_year integer not null,
  subject text not null,
  chapter text not null,
  scope_snapshot text not null,
  exclusions_snapshot text,

  created_at timestamptz not null default now(),

  constraint mock_test_syllabus_scope_unique
    unique (mock_test_id, syllabus_id)
);

create index if not exists idx_mock_test_syllabus_scope_test
  on public.mock_test_syllabus_scope(mock_test_id);

create index if not exists idx_mock_test_syllabus_scope_syllabus
  on public.mock_test_syllabus_scope(syllabus_id);

-- ------------------------------------------------------------
-- 3. UPDATED_AT TRIGGER
-- ------------------------------------------------------------
create or replace function public.neet_syllabus_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_neet_syllabus_updated_at
  on public.neet_syllabus;

create trigger trg_neet_syllabus_updated_at
before update on public.neet_syllabus
for each row
execute function public.neet_syllabus_set_updated_at();

-- ------------------------------------------------------------
-- 4. RLS
-- ------------------------------------------------------------
alter table public.neet_syllabus enable row level security;
alter table public.mock_test_syllabus_scope enable row level security;

-- Syllabus is reference data. Authenticated students may read active
-- syllabus scopes; writes remain server/admin-only.
drop policy if exists "Authenticated users can read active NEET syllabus"
  on public.neet_syllabus;

create policy "Authenticated users can read active NEET syllabus"
on public.neet_syllabus
for select
to authenticated
using (active = true);

-- Admins may manage syllabus rows through the existing is_admin() function.
drop policy if exists "Admins can manage NEET syllabus"
  on public.neet_syllabus;

create policy "Admins can manage NEET syllabus"
on public.neet_syllabus
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Mock-test syllabus snapshots are not student-editable.
drop policy if exists "Admins can manage mock test syllabus scope"
  on public.mock_test_syllabus_scope;

create policy "Admins can manage mock test syllabus scope"
on public.mock_test_syllabus_scope
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ------------------------------------------------------------
-- 5. OFFICIAL NEET-UG 2026 BIOLOGY — UNIT 7
--    Genetics and Evolution
--
-- This is the scope currently required by the MCQ generator work.
-- The remaining NEET units can be added using the same table without
-- changing the generator architecture.
-- ------------------------------------------------------------
insert into public.neet_syllabus (
  exam_type,
  exam_year,
  subject,
  unit_code,
  unit_name,
  chapter,
  scope_text,
  exclusions_text,
  source_name,
  source_url,
  source_date
)
values (
  'NEET',
  2026,
  'Biology',
  'UNIT_7',
  'Genetics and Evolution',
  'Principles of Inheritance and Variation',
  $$Heredity and variation: Mendelian Inheritance; Deviations from Mendelism — Incomplete dominance, Co-dominance, Multiple alleles and Inheritance of blood groups, Pleiotropy; Elementary idea of polygenic inheritance; Chromosome theory of inheritance; Chromosomes and genes; Sex determination — in humans, birds, honey bee; Linkage and crossing over; Sex linked inheritance — Haemophilia, Colour blindness; Mendelian disorders in humans — Thalassemia; Chromosomal disorders in humans; Down syndrome, Turner’s and Klinefelter’s syndromes.$$,
  $$Do not generate questions requiring advanced or university-level molecular/cytogenetic knowledge that is not contained in this scope. In particular, do not require XIST-mediated X-chromosome inactivation mechanisms, Robertsonian translocation mechanics, FMR1 molecular mechanisms, detailed trinucleotide-repeat expansion mechanisms, detailed enzyme deficiencies for disorders not named in the scope, or other advanced clinical genetics. Do not introduce additional genetic disorders merely because they are scientifically related to the chapter.$$,
  'National Medical Commission (NMC)',
  'https://www.nmc.org.in/MCIRest/open/getDocument?path=%2FDocuments%2FPublic%2FPortal%2FLatestNews%2FPublic+Notice_NEET_removed.pdf',
  '2025-12-22'
)
on conflict (exam_year, subject, unit_code, chapter)
do update set
  unit_name = excluded.unit_name,
  scope_text = excluded.scope_text,
  exclusions_text = excluded.exclusions_text,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  source_date = excluded.source_date,
  active = true,
  updated_at = now();

-- ------------------------------------------------------------
-- 6. ADD MOLECULAR BASIS AS A SEPARATE OFFICIAL SCOPE
-- ------------------------------------------------------------
-- Important: Molecular Basis of Inheritance is a separate official
-- syllabus section. It must NOT be silently mixed into Principles of
-- Inheritance and Variation.
insert into public.neet_syllabus (
  exam_type,
  exam_year,
  subject,
  unit_code,
  unit_name,
  chapter,
  scope_text,
  exclusions_text,
  source_name,
  source_url,
  source_date
)
values (
  'NEET',
  2026,
  'Biology',
  'UNIT_7',
  'Genetics and Evolution',
  'Molecular Basis of Inheritance',
  $$Search for genetic material and DNA as genetic material; Structure of DNA and RNA; DNA packaging; Central dogma; Transcription, genetic code, translation; Gene expression and regulation — Lac Operon; Genome and human genome project; DNA finger printing, protein biosynthesis.$$,
  $$Do not expand this scope into advanced genomics, epigenomics, CRISPR, advanced chromatin biology, advanced transcriptomics, clinical molecular genetics, or research-level molecular biology unless explicitly added to a future official syllabus scope.$$,
  'National Medical Commission (NMC)',
  'https://www.nmc.org.in/MCIRest/open/getDocument?path=%2FDocuments%2FPublic%2FPortal%2FLatestNews%2FPublic+Notice_NEET_removed.pdf',
  '2025-12-22'
)
on conflict (exam_year, subject, unit_code, chapter)
do update set
  unit_name = excluded.unit_name,
  scope_text = excluded.scope_text,
  exclusions_text = excluded.exclusions_text,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  source_date = excluded.source_date,
  active = true,
  updated_at = now();

-- ------------------------------------------------------------
-- 7. HELPER FUNCTION: GET THE ACTIVE SYLLABUS BOUNDARY
-- ------------------------------------------------------------
create or replace function public.get_neet_syllabus_scope(
  p_exam_year integer,
  p_subject text,
  p_chapter text
)
returns table (
  syllabus_id uuid,
  exam_year integer,
  subject text,
  unit_code text,
  unit_name text,
  chapter text,
  scope_text text,
  exclusions_text text,
  source_name text,
  source_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    s.id,
    s.exam_year,
    s.subject,
    s.unit_code,
    s.unit_name,
    s.chapter,
    s.scope_text,
    s.exclusions_text,
    s.source_name,
    s.source_url
  from public.neet_syllabus s
  where s.exam_year = p_exam_year
    and lower(s.subject) = lower(p_subject)
    and lower(s.chapter) = lower(p_chapter)
    and s.active = true
  order by s.unit_code, s.chapter;
$$;

-- ------------------------------------------------------------
-- 8. VERIFICATION
-- ------------------------------------------------------------
-- Expected after migration:
--   Principles of Inheritance and Variation -> 1 row
--   Molecular Basis of Inheritance           -> 1 row
--
-- Run manually if desired:
--
-- select exam_year, subject, unit_code, chapter
-- from public.neet_syllabus
-- where exam_year = 2026
-- order by subject, unit_code, chapter;
--
-- select * from public.get_neet_syllabus_scope(
--   2026,
--   'Biology',
--   'Principles of Inheritance and Variation'
-- );
-- ============================================================
