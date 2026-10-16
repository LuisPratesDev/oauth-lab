# Guia de uso — arquivos adaptados ao oauth-lab

## Ponto de partida real (verificado em 16/10/2026)

Este repositório NÃO está vazio. Na `main`, já existem `.github/workflows/ci.yml`, `migrations/0001_cria_tabelas.sql` e `wrangler.toml`. O PR #3 (branch `migracao-d1`) contém `.github/workflows/revisao-ia.yml`, `.github/workflows/migrar.yml`, a migração `0002_adiciona_coluna.sql` e commits de testes.

**Não substitua cegamente todos os arquivos do repositório nem recrie uma migração já aplicada.** Este pacote fornece referências revisadas e arquivos prontos para atualizar a branch de trabalho existente, preservando evidências e o código OAuth.

- Pull Request existente: https://github.com/LuisPratesDev/oauth-lab/pull/3
- Banco de dados: `oauth-sessions-luis_prates_dev`, binding `DB`.
- Mudança de esquema: `ALTER TABLE sessions ADD COLUMN last_seen_at INTEGER;`.
- A aplicação OAuth não possui uma tabela `notas`; `functions/api/notas.js` na branch de testes é demonstrativo e não deve ser tratado como endpoint funcional de produção.

## Preparação no GitHub (manual, nunca coloque credenciais em arquivos)

1. Em Settings → Secrets and variables → Actions, cadastre `COPILOT_PAT` (token de acesso fino, Copilot Requests: Read) e `CLOUDFLARE_API_TOKEN` (Account: D1 Edit, na conta certa), mais `CLOUDFLARE_ACCOUNT_ID` (identificador da conta, NÃO o ID do banco).
2. Em Settings → Rules → Rulesets, crie/ajuste uma regra ativa para a branch `main`, exigindo Pull Request e o status check `verificar`; mantenha lista de bypass vazia para os testes de proteção.
3. Confirme que o banco D1 e o binding DB do `wrangler.toml` correspondem à conta Cloudflare; a aplicação já usa OAuth e tabelas `sessions` e `oauth_transactions`.

## Caminho recomendado para o repositório existente

1. Trabalhe na branch já aberta `migracao-d1` e aproveite o PR #3. Se o CI e a revisão existentes já estão funcionando, NÃO refaça os testes desnecessariamente.
2. Se for atualizar, substitua apenas os workflows `.github/workflows/revisao-ia.yml` e `migrar.yml` pelos modelos deste pacote; ambos usam `actions/ai-inference@v3` com `model: ''` para não forçar `gpt-4.1`, que pode estar indisponível. O `ci.yml` fornecido é um modelo opcional, pois há um CI equivalente na `main`.
3. **Não duplique `migrations/0002_adiciona_coluna.sql`**: ela já está no PR #3. Confirme seu conteúdo e verifique se a coluna `last_seen_at` ainda não existe no D1 remoto, antes do merge.
4. Com os checks verdes, faça o merge do PR #3 e confirme uma execução do workflow `Migrar D1`, por `push` na main, com a alteração `migrations/**`.
5. No Cloudflare D1 Console, execute `PRAGMA table_info(sessions);` e salve evidência da coluna `last_seen_at`.
6. Para comprovar o filtro, abra um novo PR mudando SOMENTE `README.md`, faça merge e mostre que não apareceu uma nova run no histórico de `Migrar D1`.
7. Preencha `AVALIACAO_MODELO.md` com links REAIS, renomeie para `AVALIACAO.md` na raiz e faça a entrega final por PR (que também precisa passar no CI e na IA).

## Se fosse um repositório totalmente novo

Primeiro seria preciso incorporar a migração inicial `0001_cria_tabelas.sql` (que já existe neste repo), além dos três workflows, `wrangler.toml`, `.gitignore` e o projeto OAuth. Esse processo não se aplica literalmente ao estado atual do `oauth-lab`.

## Comandos úteis

```powershell
git clone https://github.com/LuisPratesDev/oauth-lab.git
cd oauth-lab
git fetch origin
git switch migracao-d1  # Se a branch existir no clone; caso contrário: git switch -c migracao-d1 origin/migracao-d1
git status
```

Para confirmar o banco, no painel do D1 use:

```sql
PRAGMA table_info(sessions);
```

**Importante:** `ALTER TABLE ... ADD COLUMN` não deve ser reexecutado manualmente se a coluna já existir. O Wrangler mantém o histórico de migrações; caso uma migração tenha sido registrada antes de seu conteúdo correto, crie uma NOVA migração em vez de tentar reaplicar a antiga.

**Segurança:** não publique arquivos `.env`, credenciais, logs OAuth ou PATs; testes intencionalmente inseguros devem ser feitos em PR de laboratório e corrigidos antes do merge. Nunca use `pull_request_target` para executar código não confiável com segredos.
