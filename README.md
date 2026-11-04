# Raízes da Terra

Aplicação estática com Supabase Auth, Postgres e Realtime. Sirva a raiz do projeto por HTTP/HTTPS.

## Estrutura

- `index.html`: entrada com e-mail e senha.
- `precos.html`: consulta das frutas para usuários liberados.
- `admin.html`: cadastro, preços, visibilidade e permissões.
- `registro.html`: controle de vendas, restrito aos administradores.
- `assets/css`, `assets/js`, `assets/images`: estilos, comportamento e imagens.
- `supabase/migrations`: estrutura e políticas do banco.
- `tests`: verificações locais com `node --test`.

## Ativação no Supabase existente

1. Faça backup do banco. A migração pressupõe a tabela `public.vendas` já existente e substitui suas políticas para restringir vendas aos administradores. Os registros são preservados.
2. Execute `supabase/migrations/202611030001_auth_precos.sql` no SQL Editor, uma única vez.
3. Em Authentication → Users, crie as contas do dono e do sócio com seus e-mails e novas senhas individuais. As senhas ficam sob gestão do Supabase Auth; não crie uma coluna de senhas em `perfis`.
4. Libere essas duas contas no SQL Editor, substituindo os exemplos pelos e-mails reais:

```sql
update public.perfis
set papel = 'admin', ativo = true
where email in ('dono@exemplo.com', 'socio@exemplo.com');
```

5. Confira a URL e a chave **pública** em `assets/js/config.js`. A chave pública é própria para o navegador; a proteção é feita pelas políticas RLS. Nunca coloque `service_role`, senha de banco ou chave secreta nesse arquivo.
6. Em Authentication, desative o cadastro público se o acesso for apenas por convite. Configure Site URL e Redirect URLs com o domínio publicado. Para convites ou recuperação, use o fluxo do painel Supabase e defina uma senha antes de acessar este login; a aplicação não implementa uma tela de recuperação.
7. Publique os arquivos e entre em `index.html`. Cadastre as frutas na Administração. Não foram inventados preços iniciais.

Para adicionar leitores, crie a conta em Authentication → Users e clique em **Atualizar usuários** na Administração. Libere seu acesso com a permissão **Consulta**. Novas contas começam bloqueadas, mesmo quando criadas com metadados de administrador. O administrador não pode bloquear ou rebaixar a própria conta pelo painel.

As senhas antigas estavam expostas no código e continuam no histórico Git: substitua-as, incluindo em outros serviços caso tenham sido reutilizadas. A migração não cria nem reaproveita as credenciais antigas.

## Atualizações e validação

Os preços são consultados assincronamente, com eventos do Supabase Realtime e consulta de apoio a cada 15 segundos quando a aba está visível. Ao voltar à aba ou recuperar a conexão, a consulta é refeita. Erros limpam a lista para não apresentar valores antigos como atuais. O service worker não armazena preços ou dados privados offline.

O painel detecta alterações concorrentes de uma mesma fruta: se outro administrador salvar primeiro, é preciso recarregar a página antes de tentar salvar novamente.

Execute `node --test` para verificar os guardas de acesso e as referências locais. Antes da publicação, valide no Supabase de homologação:

1. Sem sessão: leitura de frutas, perfis e vendas deve ser negada pela API.
2. Leitor liberado: consulta frutas visíveis; não altera frutas/perfis nem consulta vendas.
3. Usuário bloqueado: não consulta frutas nem vendas.
4. Administrador: cadastra e edita frutas, gerencia outros acessos e registra vendas.
5. Em dois navegadores: altere um preço como administrador e confira a atualização no leitor; depois oculte a fruta.
6. Confirme que as vendas existentes continuam disponíveis aos administradores.

A migração e a integração com o banco remoto precisam ser validadas após sua aplicação; verificações locais não substituem essa etapa.

Referências: [Supabase Auth e perfis](https://supabase.com/docs/guides/auth/managing-user-data), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
