# Sorteador Stärke

## Configuração do acesso Master na Vercel

O painel possui somente uma conta administrativa. Ela não é criada nem armazenada no navegador.

No projeto da Vercel, acesse **Settings → Environment Variables** e configure:

- `MASTER_ADMIN_NAME`: nome exibido no painel.
- `MASTER_ADMIN_LOGIN`: login do Master.
- `MASTER_ADMIN_PASSWORD`: senha forte do Master.
- `AUTH_SESSION_SECRET`: valor aleatório com no mínimo 32 caracteres, usado para assinar a sessão.

Aplique as variáveis aos ambientes desejados (Production, Preview e/ou Development) e faça um novo deployment. Alterar as variáveis não modifica deployments antigos.

Para trocar o acesso, altere o login ou a senha nas variáveis da Vercel e publique novamente. Não coloque os valores reais em `.env.example` nem faça commit de arquivos `.env.local`.
