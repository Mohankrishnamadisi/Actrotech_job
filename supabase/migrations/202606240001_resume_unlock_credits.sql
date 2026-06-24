-- Resume unlock credits system.
-- Candidate records remain in profiles; recruiter records remain in recruiters.

create extension if not exists pgcrypto;

create table if not exists public.resume_unlocks (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.recruiters(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid null references public.jobs(id) on delete set null,
  credits_used integer not null default 1 check (credits_used >= 0),
  unlocked_at timestamptz not null default now(),
  constraint resume_unlocks_recruiter_candidate_key unique (recruiter_id, candidate_id)
);

create table if not exists public.recruiter_credits (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.recruiters(id) on delete cascade,
  available_credits integer not null default 100 check (available_credits >= -1),
  used_credits integer not null default 0 check (used_credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recruiter_credits_recruiter_key unique (recruiter_id)
);

comment on column public.recruiter_credits.available_credits is
  '-1 means unlimited credits. This supports a future Pro plan without schema changes.';

create index if not exists idx_resume_unlocks_recruiter_id
  on public.resume_unlocks (recruiter_id);

create index if not exists idx_resume_unlocks_candidate_id
  on public.resume_unlocks (candidate_id);

create index if not exists idx_resume_unlocks_job_id
  on public.resume_unlocks (job_id);

create index if not exists idx_resume_unlocks_unlocked_at
  on public.resume_unlocks (unlocked_at desc);

create index if not exists idx_recruiter_credits_recruiter_id
  on public.recruiter_credits (recruiter_id);

create or replace function public.touch_recruiter_credits_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_recruiter_credits_updated_at on public.recruiter_credits;
create trigger trg_recruiter_credits_updated_at
before update on public.recruiter_credits
for each row
execute function public.touch_recruiter_credits_updated_at();

create or replace function public.resume_unlock_plan_credit_limit(plan_name text)
returns integer
language sql
immutable
as $$
  select case lower(coalesce(plan_name, ''))
    when 'basic' then 50
    when 'premium' then 250
    when 'pro' then -1
    else 100
  end;
$$;

create or replace function public.ensure_recruiter_credit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.recruiter_credits (recruiter_id, available_credits, used_credits)
  values (new.id, 100, 0)
  on conflict (recruiter_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_recruiters_create_credit_row on public.recruiters;
create trigger trg_recruiters_create_credit_row
after insert on public.recruiters
for each row
execute function public.ensure_recruiter_credit_row();

create or replace function public.sync_recruiter_credits_from_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_limit integer;
  current_used integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  if not exists (select 1 from public.recruiters where id = new.user_id) then
    return new;
  end if;

  plan_limit := public.resume_unlock_plan_credit_limit(new.plan);

  insert into public.recruiter_credits (recruiter_id, available_credits, used_credits)
  values (new.user_id, plan_limit, 0)
  on conflict (recruiter_id) do nothing;

  select used_credits
    into current_used
    from public.recruiter_credits
   where recruiter_id = new.user_id
   for update;

  update public.recruiter_credits
     set available_credits = case
           when plan_limit = -1 then -1
           else greatest(plan_limit - coalesce(current_used, 0), 0)
         end
   where recruiter_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists trg_subscriptions_sync_recruiter_credits on public.subscriptions;
create trigger trg_subscriptions_sync_recruiter_credits
after insert or update of plan, status on public.subscriptions
for each row
execute function public.sync_recruiter_credits_from_subscription();

create or replace function public.unlock_candidate_contact(
  p_candidate_id uuid,
  p_job_id uuid default null
)
returns table (
  already_unlocked boolean,
  unlock_id uuid,
  candidate_id uuid,
  candidate_email text,
  candidate_phone text,
  available_credits integer,
  used_credits integer,
  credits_used integer,
  unlocked_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recruiter_id uuid := auth.uid();
  v_credit_row public.recruiter_credits%rowtype;
  v_existing public.resume_unlocks%rowtype;
  v_unlock public.resume_unlocks%rowtype;
  v_candidate record;
begin
  if v_recruiter_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (select 1 from public.recruiters where id = v_recruiter_id) then
    raise exception 'Recruiter profile not found';
  end if;

  select id, email, phone
    into v_candidate
    from public.profiles
   where id = p_candidate_id
     and coalesce(role, 'job_seeker') = 'job_seeker';

  if v_candidate.id is null then
    raise exception 'Candidate profile not found';
  end if;

  insert into public.recruiter_credits (recruiter_id, available_credits, used_credits)
  values (v_recruiter_id, 100, 0)
  on conflict (recruiter_id) do nothing;

  select *
    into v_credit_row
    from public.recruiter_credits
   where recruiter_id = v_recruiter_id
   for update;

  select *
    into v_existing
    from public.resume_unlocks
   where recruiter_id = v_recruiter_id
     and candidate_id = p_candidate_id;

  if v_existing.id is not null then
    return query
    select
      true,
      v_existing.id,
      v_candidate.id,
      v_candidate.email::text,
      v_candidate.phone::text,
      v_credit_row.available_credits,
      v_credit_row.used_credits,
      v_existing.credits_used,
      v_existing.unlocked_at;
    return;
  end if;

  if v_credit_row.available_credits = 0 then
    raise exception 'No credits remaining' using errcode = 'P0001';
  end if;

  insert into public.resume_unlocks (recruiter_id, candidate_id, job_id, credits_used)
  values (v_recruiter_id, p_candidate_id, p_job_id, 1)
  returning * into v_unlock;

  if v_credit_row.available_credits <> -1 then
    update public.recruiter_credits
       set available_credits = available_credits - 1,
           used_credits = used_credits + 1
     where recruiter_id = v_recruiter_id
     returning * into v_credit_row;
  end if;

  insert into public.notifications (user_id, type, title, message, data, read)
  values (
    p_candidate_id,
    'resume_unlocked',
    'Candidate Contact Unlocked',
    'Recruiter unlocked candidate contact details.',
    jsonb_build_object(
      'recruiterId', v_recruiter_id,
      'candidateId', p_candidate_id,
      'jobId', p_job_id,
      'unlockId', v_unlock.id
    ),
    false
  );

  return query
  select
    false,
    v_unlock.id,
    v_candidate.id,
    v_candidate.email::text,
    v_candidate.phone::text,
    v_credit_row.available_credits,
    v_credit_row.used_credits,
    v_unlock.credits_used,
    v_unlock.unlocked_at;
end;
$$;

revoke all on function public.unlock_candidate_contact(uuid, uuid) from public;
grant execute on function public.unlock_candidate_contact(uuid, uuid) to authenticated;

alter table public.resume_unlocks enable row level security;
alter table public.recruiter_credits enable row level security;

drop policy if exists "Recruiters can view their own resume unlocks" on public.resume_unlocks;
create policy "Recruiters can view their own resume unlocks"
on public.resume_unlocks
for select
to authenticated
using (recruiter_id = auth.uid());

drop policy if exists "Recruiters can insert their own resume unlocks" on public.resume_unlocks;
create policy "Recruiters can insert their own resume unlocks"
on public.resume_unlocks
for insert
to authenticated
with check (recruiter_id = auth.uid());

drop policy if exists "Recruiters can view their own credits" on public.recruiter_credits;
create policy "Recruiters can view their own credits"
on public.recruiter_credits
for select
to authenticated
using (recruiter_id = auth.uid());

drop policy if exists "Recruiters can insert their own credits" on public.recruiter_credits;
create policy "Recruiters can insert their own credits"
on public.recruiter_credits
for insert
to authenticated
with check (recruiter_id = auth.uid());
