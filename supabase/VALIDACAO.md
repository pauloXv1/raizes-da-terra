# Validação remota — 03/11/2026 (America/Sao_Paulo)

Projeto: `rpozdqemixvqfbjrtdpq` (`raizesDaTerra`).

## Migrações

- O histórico estava vazio. Tabelas, colunas, constraints, funções, gatilhos, grants, políticas e publicação Realtime da primeira migração foram inspecionados. A estrutura já existia; não foi recriada.
- A segunda migração ainda não existia: faltava `perfis.aprovado`, vendas eram legíveis somente por administradores e a unidade `maco` não era aceita.
- A segunda foi aplicada com sucesso pelo MCP, incluindo a remoção de EXECUTE de `anon` nos auxiliares e de `anon`/`authenticated` no gatilho `criar_perfil`. Os grants explícitos antigos sobreviviam a REVOKE somente de PUBLIC.
- O MCP gerou inicialmente a versão `20261104020213` para `cadastro_visualizacao`. O histórico foi reconciliado por DML transacional: primeira migração registrada como baseline `202611030001` (estrutura previamente conferida), segunda renumerada para `202611030002`. Não houve repetição do DDL da primeira.
- O administrador existente permanece ativo e agora tem `aprovado = true`.

## Testes realizados

Os oito testes locais passaram. O arquivo `tests/remote-access.sql` passou no banco remoto usando SET LOCAL ROLE e claims de identidades temporárias, com ROLLBACK ao final:

- Gatilho cria leitor pendente e ignora metadados que tentam conceder administração.
- Visitante não lê perfis, produtos ou vendas e não executa auxiliares privilegiados.
- Pendente lê somente o próprio perfil e não se aprova/promove.
- Administrador aprova e recusa outro perfil, edita produtos e insere/exclui vendas.
- Administrador não bloqueia a própria conta nem altera a coluna de e-mail via cliente.
- Auditoria de produto registra a identidade administrativa.
- Leitor aprovado consulta produtos visíveis e vendas, mas não vê produtos ocultos nem outros perfis.
- Leitor não insere/edita produtos, não insere/edita/exclui vendas nem promove a própria conta.
- Bloqueio retira o acesso com os mesmos claims, sem depender de renovação do JWT.
- Conta recusada permanece sem acesso aos produtos e vendas.

Após o ROLLBACK: 1 perfil, 2 produtos e 75 vendas no banco. Nenhuma fixture permanece. Esses números são contagens exatas; o resumo inicial de tabelas do MCP usava estimativas.

## Avisos dos advisors

- Removidos os avisos de execução anônima de funções privilegiadas e de exposição do gatilho a clientes autenticados.
- Restam avisos para `e_admin()` e `tem_acesso()` por serem SECURITY DEFINER executáveis por usuários autenticados. Esse uso é intencional nas políticas para consultar o próprio perfil sem recursão RLS: não recebem IDs, usam `auth.uid()`, possuem `search_path` vazio e retornam apenas booleanos. [Orientação do advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Proteção contra senhas vazadas está desabilitada no Auth. Não foi alterada: a configuração não está exposta pelas ferramentas disponíveis. [Orientação](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Aviso informativo: FK `frutas.atualizado_por` sem índice dedicado. Com dois produtos, não foi criado índice adicional neste ajuste. [Orientação](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

## Pendências externas

- Conferir habilitação do cadastro por e-mail, confirmação, SMTP e Site URL/Redirect URLs no painel Auth. O código solicita retorno para `index.html`, mas o domínio publicado não está identificado nos arquivos locais. Não há ferramenta MCP de configuração do Auth nesta sessão.
- Validar envio/recebimento e clique no e-mail, login e interface em navegador. Os testes SQL exercitam RLS/gatilhos, não o serviço Auth nem o navegador.
- Git: acesso local a `github.com:443` falhou novamente. O push deve ser confirmado pela comparação entre HEAD e `origin/main` após recuperar a conexão. Backups corrompidos estão ignorados e não devem ser enviados.
