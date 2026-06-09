create table if not exists public.user_daily_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  chat_count integer not null default 0 check (chat_count >= 0),
  image_count integer not null default 0 check (image_count >= 0),
  video_count integer not null default 0 check (video_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists user_daily_usage_user_date_idx
  on public.user_daily_usage (user_id, date);

create index if not exists user_daily_usage_date_idx
  on public.user_daily_usage (date);

alter table public.user_daily_usage enable row level security;

drop policy if exists "Users can read own daily usage" on public.user_daily_usage;
create policy "Users can read own daily usage"
  on public.user_daily_usage
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Service role manages usage" on public.user_daily_usage;
create policy "Service role manages usage"
  on public.user_daily_usage
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Users cannot insert usage rows directly" on public.user_daily_usage;
create policy "Users cannot insert usage rows directly"
  on public.user_daily_usage
  for insert
  to authenticated
  with check (false);

create or replace function public.increment_user_daily_usage(
  p_user_id uuid,
  p_action text,
  p_limit integer
)
returns table(allowed boolean, remaining integer, current_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := current_date;
  v_column text;
  v_current integer;
begin
  if p_action not in ('chat', 'image', 'video') then
    raise exception 'Invalid usage action: %', p_action;
  end if;

  v_column := p_action || '_count';

  insert into public.user_daily_usage (user_id, date, chat_count, image_count, video_count)
  values (p_user_id, v_today, 0, 0, 0)
  on conflict (user_id, date) do nothing;

  execute format(
    'update public.user_daily_usage
       set %I = %I + 1, updated_at = now()
     where user_id = $1
       and date = $2
       and %I < $3
     returning %I',
    v_column,
    v_column,
    v_column,
    v_column
  )
  into v_current
  using p_user_id, v_today, p_limit;

  if v_current is null then
    execute format(
      'select %I from public.user_daily_usage where user_id = $1 and date = $2',
      v_column
    )
    into v_current
    using p_user_id, v_today;

    return query select false, 0, coalesce(v_current, p_limit);
    return;
  end if;

  return query select true, greatest(0, p_limit - v_current), v_current;
end;
$$;

create or replace function public.refund_user_daily_usage(
  p_user_id uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_column text;
begin
  if p_action not in ('chat', 'image', 'video') then
    raise exception 'Invalid usage action: %', p_action;
  end if;

  v_column := p_action || '_count';

  execute format(
    'update public.user_daily_usage
       set %I = greatest(0, %I - 1), updated_at = now()
     where user_id = $1 and date = current_date',
    v_column,
    v_column
  )
  using p_user_id;
end;
$$;

revoke all on function public.increment_user_daily_usage(uuid, text, integer) from public;
revoke all on function public.refund_user_daily_usage(uuid, text) from public;

grant execute on function public.increment_user_daily_usage(uuid, text, integer) to service_role;
grant execute on function public.refund_user_daily_usage(uuid, text) to service_role;
