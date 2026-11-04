# Raízes da Terra

Aplicação estática com Supabase Auth, Postgres e Realtime. Sirva a raiz do projeto por HTTP/HTTPS.

## Páginas e acesso

- `index.html`: login por e-mail e senha e retorno da confirmação de e-mail.
- `cadastro.html`: solicitação de conta com confirmação de senha.
- `inicio.html`: situação do cadastro e acessos disponíveis.
- `precos.html`: consulta de produtos visíveis (frutas, legumes e folhagens).
- `registro.html`: consulta de vendas por leitores aprovados e administração de vendas por administradores.
- `admin.html`: produtos, preços, visibilidade, aprovação, recusa e bloqueio de usuários.

As páginas usam o tema verde compartilhado em `assets/css/app.css`. A tabela física `frutas` representa todos os produtos e aceita também a unidade `maco`.

Novos perfis começam com `papel = 'leitor'`, `ativo = false` e `aprovado = false`, independentemente dos metadados enviados pelo cliente. O administrador aprova (`ativo = true`, `aprovado = true`) ou recusa (`ativo = false`, `aprovado = true`) o cadastro. O bloqueio posterior também desativa o acesso. O administrador não altera o próprio acesso pelo painel.

## Migrações

Para uma instalação em que `public.vendas` já existe, execute uma única vez, nesta ordem:

1. `supabase/migrations/202611030001_auth_precos.sql`
2. `supabase/migrations/202611030002_cadastro_visualizacao.sql`

Confira o esquema e o histórico antes de executar. A primeira cria perfis/produtos, gatilhos e políticas; a segunda adiciona aprovação, consulta de vendas para leitores e a unidade maço. A segunda também restringe permissões explícitas de execução de funções encontradas no banco existente. Os registros existentes são preservados.

No projeto `rpozdqemixvqfbjrtdpq`, a primeira já existia no esquema sem registro no histórico. Sua estrutura foi conferida e registrada como baseline, sem reexecutar a criação das tabelas. A segunda foi aplicada pelo MCP e o histórico foi reconciliado com as versões locais `202611030001` e `202611030002`. Consulte `supabase/VALIDACAO.md` antes de qualquer reaplicação.

Para estabelecer o primeiro administrador em uma instalação nova, use o SQL Editor e o e-mail real da conta criada no Supabase Auth:

```sql
update public.perfis
set papel = 'admin', ativo = true, aprovado = true
where email = 'administrador@exemplo.com';
```

## Configuração do Supabase Auth

Em Authentication, habilite cadastro por e-mail e confirmação de e-mail. A confirmação do endereço e a aprovação do administrador são etapas independentes. Configure:

- **Site URL**: URL pública real da aplicação.
- **Redirect URLs**: URL absoluta de `index.html` no domínio e caminho publicados. O cadastro usa `new URL('index.html', location.href)` em `emailRedirectTo`; em produção, cadastre essa URL exata.
- Para desenvolvimento, inclua separadamente a URL local de `index.html` com a porta usada.

Não presuma que o endereço do repositório GitHub é o domínio publicado. Confira o SMTP, os limites de envio e o modelo de confirmação. A aplicação não implementa recuperação de senha. As configurações atuais de cadastro, confirmação e redirecionamento ainda precisam ser conferidas no painel: os recursos MCP disponíveis nesta sessão não expõem a configuração do Auth.

A URL e a chave pública ficam em `assets/js/config.js`. Nunca exponha `service_role`, senha de banco ou chave secreta no navegador. A proteção dos dados é feita por grants e RLS no banco. Substitua quaisquer senhas antigas que tenham sido publicadas no histórico do repositório.

## Atualizações e validação

Os preços usam Realtime e consulta de apoio a cada 15 segundos quando a aba está visível. Ao voltar à aba ou recuperar a conexão, a consulta é refeita. Erros limpam a lista. O service worker não armazena preços ou dados privados offline. A edição de produtos detecta alterações concorrentes e exige recarregar antes de sobrescrever uma versão modificada por outro administrador.

Execute `node --test` para os testes locais. `tests/remote-access.sql` valida permissões com os papéis reais `anon` e `authenticated`, inclusive aprovação, recusa, bloqueio, escrita administrativa e tentativa de elevação de permissão. Execute o arquivo integralmente como postgres: os dados temporários são descartados por `ROLLBACK`. Esse teste não envia mensagens, não autentica pelo serviço Auth e não substitui testes no navegador.

Antes de liberar novos cadastros em produção, valide o envio e recebimento da confirmação, o retorno para `index.html`, o login, a aprovação e o bloqueio no navegador. Em dois navegadores, confira também atualização e ocultação de produtos pelo Realtime.

Backups `*.corrompido.bak` são locais e estão ignorados pelo Git.

Referências: [perfis](https://supabase.com/docs/guides/auth/managing-user-data), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [redirecionamentos](https://supabase.com/docs/guides/auth/redirect-urls).
