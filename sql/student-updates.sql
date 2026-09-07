/* =========================================================
   NOW-or-NEVER — STUDENT UPDATES READ API
   Public-to-authenticated read access through a security-definer RPC.
   Students can only receive enabled + published updates.
   ========================================================= */

create or replace function public.student_updates_list_public()
returns table (
  id bigint,
  title text,
  content text,
  update_type text,
  icon text,
  pinned boolean,
  published_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    u.id,
    u.title,
    u.content,
    u.update_type,
    u.icon,
    u.pinned,
    u.published_at
  from public.updates u
  where u.enabled = true
    and u.published_at is not null
  order by u.pinned desc, u.published_at desc, u.id desc;
$$;

revoke execute on function public.student_updates_list_public() from public;
grant execute on function public.student_updates_list_public() to authenticated;
