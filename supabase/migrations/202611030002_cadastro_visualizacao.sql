-- Execute depois de 202611030001_auth_precos.sql, uma única vez.
begin;

-- Distingue novas solicitações de usuários que já foram aprovados/bloqueados.
alter table public.perfis add column aprovado boolean not null default false;
update public.perfis set aprovado = true where ativo;
grant update (aprovado) on public.perfis to authenticated;

-- Leitores liberados consultam vendas, mas as políticas de escrita
-- da primeira migração continuam exclusivas dos administradores.
drop policy vendas_leitura on public.vendas;
create policy vendas_leitura on public.vendas
for select to authenticated using (public.tem_acesso());

-- A tabela frutas passa a representar qualquer produto no aplicativo.
-- Preservamos seu nome físico e seus dados para compatibilidade.
comment on table public.frutas is 'Produtos: frutas, legumes e folhagens.';
alter table public.frutas drop constraint frutas_unidade_check;
alter table public.frutas add constraint frutas_unidade_check
check (unidade in ('kg','un','cx','bandeja','duzia','maco'));

commit;
