# Sorteador Stärke

## Configuração do acesso Master na Vercel

O painel possui somente uma conta administrativa. Ela não é criada nem armazenada no navegador.

No projeto da Vercel, acesse **Settings → Environment Variables** e configure:

- `MASTER_ADMIN_NAME`: nome exibido no painel.
- `MASTER_ADMIN_LOGIN`: login do Master.
- `MASTER_ADMIN_PASSWORD`: senha forte do Master.
- `AUTH_SESSION_SECRET`: valor aleatório com no mínimo 32 caracteres, usado para assinar a sessão.
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SECRET_KEY`: chave secreta do backend (`sb_secret_...`). Como alternativa temporária, a API também aceita `SUPABASE_SERVICE_ROLE_KEY`.

Aplique as variáveis aos ambientes desejados (Production, Preview e/ou Development) e faça um novo deployment. Alterar as variáveis não modifica deployments antigos.

Para trocar o acesso, altere o login ou a senha nas variáveis da Vercel e publique novamente. Não coloque os valores reais em `.env.example` nem faça commit de arquivos `.env.local`.

## Banco de dados Supabase

Execute no SQL Editor do projeto o arquivo:

`supabase/schema.sql`

A migração cria a tabela `public.app_state`, ativa RLS, remove todo acesso de `anon` e `authenticated` e concede acesso somente ao backend. Depois de executar a migração e cadastrar as variáveis acima, faça um novo deployment na Vercel.

Todos os dados operacionais passam a ser carregados e salvos no Supabase. A consulta pública recebe apenas os dados da campanha ativa e as participações correspondentes ao código informado; ela não recebe o banco administrativo completo.
