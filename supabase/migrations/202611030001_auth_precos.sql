begin;
create table public.perfis (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 nome text not null default '',
 papel text not null default 'leitor' check (papel in ('leitor','admin')),
 ativo boolean not null default false
);
alter table public.perfis enable row level security;
create function public.e_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.perfis where id = (select auth.uid()) and ativo and papel = 'admin');
$$;
create function public.tem_acesso() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.perfis where id = (select auth.uid()) and ativo);
$$;
revoke all on function public.e_admin(), public.tem_acesso() from public;
grant execute on function public.e_admin(), public.tem_acesso() to authenticated;
create policy perfis_leitura on public.perfis for select to authenticated using (id = (select auth.uid()) or public.e_admin());
create policy perfis_edicao on public.perfis for update to authenticated using (public.e_admin() and id <> (select auth.uid())) with check (public.e_admin() and id <> (select auth.uid()));
revoke all on public.perfis from anon, authenticated;
grant select on public.perfis to authenticated;
grant update (papel, ativo) on public.perfis to authenticated;
create function public.criar_perfil() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.perfis(id,email) values(new.id,coalesce(new.email,''));
 return new;
end;
$$;
revoke all on function public.criar_perfil() from public;
create trigger criar_perfil after insert on auth.users for each row execute function public.criar_perfil();
insert into public.perfis(id,email) select id,coalesce(email,'') from auth.users on conflict(id) do nothing;
create table public.frutas (
 id uuid primary key default gen_random_uuid(),
 nome text not null check (char_length(trim(nome)) between 1 and 80),
 unidade text not null check (unidade in ('kg','un','cx','bandeja','duzia')),
 preco numeric(8,2) not null check (preco >= 0),
 ativo boolean not null default true,
 atualizado_em timestamptz not null default now(),
 atualizado_por uuid references auth.users(id) on delete set null
);
create function public.auditar_fruta() returns trigger language plpgsql set search_path = '' as $$
begin
 new.atualizado_em = clock_timestamp(); new.atualizado_por = auth.uid(); return new;
end;
$$;
create trigger auditar_fruta before insert or update on public.frutas for each row execute function public.auditar_fruta();
alter table public.frutas enable row level security;
revoke all on public.frutas from anon, authenticated;
grant select, insert, update on public.frutas to authenticated;
create policy frutas_leitura on public.frutas for select to authenticated using (public.tem_acesso() and (ativo or public.e_admin()));
create policy frutas_cadastro on public.frutas for insert to authenticated with check (public.e_admin());
create policy frutas_edicao on public.frutas for update to authenticated using (public.e_admin()) with check (public.e_admin());
-- Substitui políticas antigas permissivas de vendas, preservando os registros.
alter table public.vendas enable row level security;
do $$ declare p record; begin
 for p in select policyname from pg_policies where schemaname='public' and tablename='vendas' loop
 execute format('drop policy %I on public.vendas',p.policyname);
 end loop;
end $$;
revoke all on public.vendas from anon, authenticated;
grant select, insert, delete on public.vendas to authenticated;
do $$ declare seq text; begin
 seq := pg_get_serial_sequence('public.vendas','id');
 if seq is not null then execute format('grant usage on sequence %s to authenticated',seq); end if;
end $$;
create policy vendas_leitura on public.vendas for select to authenticated using (public.e_admin());
create policy vendas_cadastro on public.vendas for insert to authenticated with check (public.e_admin());
create policy vendas_exclusao on public.vendas for delete to authenticated using (public.e_admin());
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='frutas') then
 alter publication supabase_realtime add table public.frutas;
 end if;
end $$;
commit;
