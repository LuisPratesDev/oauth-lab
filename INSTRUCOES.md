# Roteiro da entrega — GitHub Actions com IA

Tudo que dava para fazer sem o navegador já está pronto e commitado em quatro
branches. O que sobra depende de você (segredos, regra da `main`) e dos **pushes
em ordem** — algumas evidências vêm do estado intermediário de uma branch, não
do tip.

| Branch | Tarefa | Commits (SHA curto) |
|---|---|---|
| `ci` | T1 | `c0fef1f` vermelho → `589c09c` verde (tip) |
| `revisao-ia` | T3 | `db34a5c` workflow → `596b930` vulnerável → `4aa740f` corrigido → `4095726` sem permissão → `98e68b6` restaurada (tip) |
| `migracao-d1` | T2 + T4 | `6a9903e` PR bloqueado → `2f25045` liberado (tip) |
| `entrega` | entrega | `AVALIACAO.md` + este roteiro |

> Os SHAs longos estão em `git log --oneline` de cada branch; para os pushes use
> o SHA curto, o Git resolve localmente.

---

## Passo 0 — PAT e secrets (≈10 min, só no navegador)

1. **PAT da Copilot** — avatar → *Settings* → *Developer settings* →
   *Personal access tokens* → *Fine-grained tokens* → **Generate new token**:
   - Name: `copilot-actions` · Expiration: **7 days** · Resource owner: sua conta;
   - *Account permissions* → **Copilot Requests** → *Read*;
   - Generate → copie o `github_pat_...` (só aparece uma vez).
2. **Secrets do repositório** — *Settings* → *Secrets and variables* → *Actions*
   → *New repository secret*, três vezes:
   - `COPILOT_PAT` = o PAT do passo 1;
   - `CLOUDFLARE_API_TOKEN` = token em *My Profile → API Tokens → Create Token*
     (Custom token: **Account → D1 → Edit**; Account Resources: sua conta);
   - `CLOUDFLARE_ACCOUNT_ID` = o id da conta (aparece no *Overview* de
     Workers & Pages; 32 caracteres hexadecimais).
3. **Actions** — *Settings* → *Actions* → *General*: Actions habilitado e, em
   *Workflow permissions*, marque **Read and write permissions** (é o que
   permite ao `github.token` comentar no PR).

---

## Passo 1 — Tarefa 1: uma execução vermelha e uma verde

```bash
git switch ci
# 1) sobe só o commit com a migração quebrada -> execução VERMELHA
git push origin c0fef1f:refs/heads/ci
# 2) sobe a correção -> execução VERDE
git push origin ci
```

- Em **Actions → ci**, abra as duas runs e copie os links.
- Na vermelha, abra o step *Aplica as migrações D1 em um SQLite local* e copie a
  linha do erro: `Parse error near line 10: near "CREATE": syntax error`.

---

## Passo 2 — Tarefa 2: proteger a `main`

1. *Settings* → *Rules* → *Rulesets* → **New branch ruleset**:
   - Name: `protege-main` · Enforcement: **Active** · Target branches:
     *Add target* → *Include default branch*;
   - ☑ **Require a pull request before merging**;
   - ☑ **Require status checks to pass** → *Add checks* → **`verificar`**
     (já existe porque a run do Passo 1 rodou).
   - Deixe a *bypass list* vazia — assim a regra vale para você também.
2. **Push direto recusado** (evidência da Tarefa 2, item 3):

```bash
git fetch origin
git switch main
git commit --allow-empty -m "teste de push direto na main"
git push origin main            # <- copie a saída recusada
git reset --hard origin/main    # desfaz o commit de teste
```

3. **PR do `ci`** (leva o CI para a `main`): no GitHub, *Pull requests* →
   *New pull request* — base `main`, compare `ci` → crie → espere o `verificar`
   verde → **Merge pull request** (*Create a merge commit*).

---

## Passo 3 — Tarefa 3: revisão do PR por IA

```bash
git switch revisao-ia
# 1) código com SQL por concatenação -> PR aberto -> 1º comentário da IA
git push origin 596b930:refs/heads/revisao-ia
# 2) correção com prepare().bind() -> evento "synchronize" -> 2º comentário
git push origin 4aa740f:refs/heads/revisao-ia
# 3) permissão pull-requests removida -> erro no passo "Comenta no PR"
git push origin 4095726:refs/heads/revisao-ia
# 4) permissão restaurada
git push origin revisao-ia
```

1. Abra o PR (`revisao-ia` → `main`), deixe aberto e copie o link dos **dois
   comentários** da IA (um por commit).
2. No terceiro push, abra a run vermelha e copie o erro de permissão
   (`Resource not accessible by integration`).
3. Leia os comentários e escolha **uma afirmação errada ou irrelevante** para o
   item 4 do `AVALIACAO.md` (o texto está marcado com ⬜).
4. Depois disso, faça o **merge desse PR** — é ele que serve de prova de que o
   `migrar` não roda quando o merge não mexe em `migrations/**`.

---

## Passo 4 — Tarefas 2 e 4: PR da migração `0002`

```bash
git switch migracao-d1
# 1) `ALTER TABEL` de propósito -> check `verificar` vermelho, merge BLOQUEADO
git push origin 6a9903e:refs/heads/migracao-d1
# 2) correção -> check verde, PR LIBERADO
git push origin migracao-d1
```

1. Abra o PR (`migracao-d1` → `main`) e copie:
   - o link do PR **bloqueado** (check vermelho + aviso de merge bloqueado);
   - o link do mesmo PR **liberado** depois do push da correção.
2. **Merge** (*Create a merge commit*). Esse merge altera `migrations/**` e
   dispara o workflow **`migrar`** → copie o link da run (Tarefa 4).
3. Confirme a coluna nova (escolha um):
   - painel: *Workers & Pages → D1 → oauth-sessions-luis_prates_dev → Console*
     → `PRAGMA table_info(sessions);` (a última linha é `last_seen_at`);
   - ou local: `npx wrangler d1 execute oauth-sessions-luis_prates_dev --remote --command "PRAGMA table_info(sessions)"`.
4. Na run do `migrar`, abra a aba **Summary**: o resumo por IA do bônus aparece
   lá (copie o link).

---

## Passo 5 — Entrega: `AVALIACAO.md`

1. Me mande os links coletados (ou edite o arquivo direto no GitHub) que eu
   preencho os ⬜ e faço o commit.
2. ```bash
   git switch entrega
   git push origin entrega
   ```
3. Abra o PR de entrega (`entrega` → `main`): ele passa pelo `verificar` **e**
   pela revisão da IA (como o enunciado pede) e **não** dispara o `migrar`
   (não toca `migrations/**`) — segunda prova do item 3 da Tarefa 4.
4. Merge.

---

## Se algo der errado

- **`migrar` falhando antes de você configurar os secrets:** a run nasce
  vermelha porque `wrangler` não tem token. Configure o Passo 0 e use
  *Re-run all jobs* na mesma run (não precisa de novo commit).
- **`revisao-ia` não publica comentário:** confira `COPILOT_PAT` (validade de 7
  dias e permissão *Copilot Requests*) e a *Workflow permissions* em *Read and
  write*. Sem o PAT o passo da IA falha; o passo do comentário falha em cascata.
- **`wrangler` reclamando de projeto Pages** no `migrar.yml`: remova a linha
  `pages_build_output_dir = "public"` do `wrangler.toml` e faça novo push na
  `main` que toque `migrations/` (o binding do D1 continua sendo lido).
- **`Everything up-to-date` no teste de push direto:** você está sem commit novo
  na `main`; use `git commit --allow-empty` como no Passo 2.
