-- Execute como postgres, integralmente, pelo SQL Editor ou MCP execute_sql.
-- Exercita RLS com os papéis reais. Não envia e-mails nem testa o serviço Auth.
-- Todas as contas, produtos e vendas de teste são descartados no ROLLBACK.
begin;
select set_config('raizes.test_admin', gen_random_uuid()::text, true),
       set_config('raizes.test_reader', gen_random_uuid()::text, true),
       set_config('raizes.test_visible', gen_random_uuid()::text, true),
       set_config('raizes.test_hidden', gen_random_uuid()::text, true),
       set_config('raizes.test_sale', (-(1 + floor(random()*1000000000000)::bigint))::text, true);

insert into auth.users(id, email, raw_user_meta_data)
select current_setting('raizes.test_admin')::uuid, 'rls-admin-' || current_setting('raizes.test_admin') || '@example.invalid', '{}'::jsonb
union all
select current_setting('raizes.test_reader')::uuid, 'rls-reader-' || current_setting('raizes.test_reader') || '@example.invalid',
       '{"papel":"admin","ativo":true,"aprovado":true}'::jsonb;

do $$ begin
 if not exists(select 1 from public.perfis where id=current_setting('raizes.test_reader')::uuid
               and papel='leitor' and not ativo and not aprovado) then
  raise exception 'Cadastro/trigger: metadados não podem conceder acesso';
 end if;
end $$;
update public.perfis set papel='admin', ativo=true, aprovado=true where id=current_setting('raizes.test_admin')::uuid;
insert into public.frutas(id,nome,unidade,preco,ativo) values
 (current_setting('raizes.test_visible')::uuid,'Teste RLS visível','maco',1,true),
 (current_setting('raizes.test_hidden')::uuid,'Teste RLS oculto','kg',2,false);
insert into public.vendas(id,data_venda,dinheiro,pix,cartao,total,gastos)
values(current_setting('raizes.test_sale')::bigint,current_date,1,0,0,1,0);

-- Visitante: sem acesso às tabelas e aos auxiliares privilegiados.
set local role anon;
do $$ declare t text; begin
 foreach t in array array['perfis','frutas','vendas'] loop
  begin
   execute format('select * from public.%I limit 1',t);
   raise exception 'Visitante conseguiu ler %',t;
  exception when insufficient_privilege then null;
  end;
 end loop;
 if has_function_privilege(current_user,'public.e_admin()','EXECUTE')
    or has_function_privilege(current_user,'public.tem_acesso()','EXECUTE')
    or has_function_privilege(current_user,'public.criar_perfil()','EXECUTE') then
  raise exception 'Visitante pode executar função privilegiada';
 end if;
end $$;
reset role;

select set_config('request.jwt.claim.sub',current_setting('raizes.test_reader'),true),
       set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('raizes.test_reader'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare n integer; begin
 if public.e_admin() or public.tem_acesso() then raise exception 'Pendente ganhou acesso'; end if;
 if (select count(*) from public.perfis)<>1 then raise exception 'Pendente viu outros perfis'; end if;
 if exists(select 1 from public.frutas) or exists(select 1 from public.vendas) then raise exception 'Pendente leu dados'; end if;
 update public.perfis set papel='admin',ativo=true,aprovado=true where id=auth.uid();
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Pendente elevou as próprias permissões'; end if;
 if has_function_privilege(current_user,'public.criar_perfil()','EXECUTE') then raise exception 'Trigger exposto ao cliente'; end if;
end $$;
reset role;

-- Administrador aprova outro perfil, mas não altera seu próprio acesso/email.
select set_config('request.jwt.claim.sub',current_setting('raizes.test_admin'),true),
       set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('raizes.test_admin'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare n integer; begin
 if not public.e_admin() then raise exception 'Admin sem acesso'; end if;
 if not exists(select 1 from public.frutas where id=current_setting('raizes.test_hidden')::uuid) then raise exception 'Admin não vê ocultos'; end if;
 update public.perfis set ativo=true,aprovado=true where id=current_setting('raizes.test_reader')::uuid;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Aprovação falhou'; end if;
 update public.perfis set ativo=false where id=auth.uid();
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Admin conseguiu se bloquear'; end if;
 begin
  update public.perfis set email='nao-permitido@example.invalid' where id=current_setting('raizes.test_reader')::uuid;
  raise exception 'Admin alterou coluna não autorizada';
 exception when insufficient_privilege then null;
 end;
 update public.frutas set preco=3 where id=current_setting('raizes.test_visible')::uuid;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Admin não editou produto'; end if;
 if not exists(select 1 from public.frutas where id=current_setting('raizes.test_visible')::uuid and atualizado_por=auth.uid()) then raise exception 'Auditoria não registrou admin'; end if;
 delete from public.vendas where id=current_setting('raizes.test_sale')::bigint;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Admin não excluiu venda'; end if;
 insert into public.vendas(id,total) values(current_setting('raizes.test_sale')::bigint,1);
end $$;
reset role;

select set_config('request.jwt.claim.sub',current_setting('raizes.test_reader'),true),
       set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('raizes.test_reader'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare n integer; begin
 if not public.tem_acesso() or public.e_admin() then raise exception 'Papel do leitor incorreto'; end if;
 if not exists(select 1 from public.frutas where id=current_setting('raizes.test_visible')::uuid) then raise exception 'Leitor não consultou produto'; end if;
 if exists(select 1 from public.frutas where id=current_setting('raizes.test_hidden')::uuid) then raise exception 'Leitor viu produto oculto'; end if;
 if not exists(select 1 from public.vendas where id=current_setting('raizes.test_sale')::bigint) then raise exception 'Leitor não consultou vendas'; end if;
 if (select count(*) from public.perfis)<>1 then raise exception 'Leitor viu outros perfis'; end if;
 update public.frutas set preco=4 where id=current_setting('raizes.test_visible')::uuid;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Leitor editou produto'; end if;
 update public.perfis set papel='admin' where id=auth.uid();
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Leitor elevou permissão'; end if;
 delete from public.vendas where id=current_setting('raizes.test_sale')::bigint;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Leitor excluiu venda'; end if;
 begin
  insert into public.frutas(nome,unidade,preco) values('Não permitido','kg',1);
  raise exception 'Leitor inseriu produto';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.vendas(id,total) values(current_setting('raizes.test_sale')::bigint-1,1);
  raise exception 'Leitor inseriu venda';
 exception when insufficient_privilege then null;
 end;
 begin
  update public.vendas set total=2 where id=current_setting('raizes.test_sale')::bigint;
  raise exception 'Leitor atualizou venda';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;

-- A mesma identidade perde acesso imediatamente, sem trocar os claims JWT.
update public.perfis set ativo=false where id=current_setting('raizes.test_reader')::uuid;
set local role authenticated;
do $$ begin
 if public.tem_acesso() or public.e_admin() then raise exception 'Bloqueado mantém acesso'; end if;
 if exists(select 1 from public.frutas) or exists(select 1 from public.vendas) then raise exception 'Bloqueado leu dados'; end if;
 if not exists(select 1 from public.perfis where id=auth.uid() and aprovado and not ativo) then raise exception 'Bloqueado não consulta situação'; end if;
end $$;
reset role;

-- Recria a situação pendente somente na fixture para testar recusa pelo admin.
update public.perfis set aprovado=false where id=current_setting('raizes.test_reader')::uuid;
select set_config('request.jwt.claim.sub',current_setting('raizes.test_admin'),true),
       set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('raizes.test_admin'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare n integer; begin
 update public.perfis set ativo=false,aprovado=true,papel='leitor' where id=current_setting('raizes.test_reader')::uuid;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Admin não recusou cadastro'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('raizes.test_reader'),true),
       set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('raizes.test_reader'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if public.tem_acesso() or exists(select 1 from public.vendas) or exists(select 1 from public.frutas) then raise exception 'Recusado ganhou acesso'; end if;
 if not exists(select 1 from public.perfis where id=auth.uid() and aprovado and not ativo) then raise exception 'Recusa não registrada'; end if;
end $$;
reset role;
rollback;
select 'PASS: cadastro/trigger, visitante, pendente, aprovação, leitor, admin, bloqueio, recusa e auditoria; fixtures descartadas' as resultado;
