# Avaliação: GitHub Actions com IA

**Repositório:** [github.com/LuisPratesDev/oauth-lab](https://github.com/LuisPratesDev/oauth-lab)
**Dupla:** Luís Prates · ⬜ preencher o nome do colega
**Site:** https://oauth-lab.pages.dev (Cloudflare Pages + Functions + D1, login OAuth)

Os três workflows ficaram em `.github/workflows/`, um por arquivo:

| Arquivo | Gatilho | O que faz |
|---|---|---|
| `ci.yml` | `push` (qualquer branch) e `pull_request` para `main` | segredo versionado, migrações em SQLite, HTML |
| `revisao-ia.yml` | `pull_request` (`opened`, `synchronize`) | revisão do diff por IA como comentário no PR |
| `migrar.yml` | `push` na `main` com `paths: ['migrations/**']` | aplica as migrações no D1 remoto |

> ⬜ = link a colar depois de rodar no GitHub. Nenhum segredo aparece nos arquivos
> versionados; os valores dos testes (PAT, tokens, ids) ficam só nos *secrets* do
> repositório.

---

## Tarefa 1 — CI a cada commit (2,5)

**Lacunas do esqueleto preenchidas**

1. Aplicar cada migração no SQLite local: `sqlite3 teste.db < "$f"` dentro do
   `for f in migrations/*.sql`. O banco de destino é descartável (`teste.db`), e
   como os *steps* rodam com `bash -e`, o primeiro erro de SQL derruba o job.
2. Validar o HTML: `npx --yes htmlhint "**/*.html"`.

**Commit proposital que falha** — `c0fef1f`: a migração `0001` foi enviada sem o
`);` que fecha a primeira tabela (`expires_at INTEGER NOT NULL` seguido direto de
`CREATE INDEX`). O job `verificar` parou no step *Aplica as migrações D1 em um
SQLite local*.

| Evidência | Link / conteúdo |
|---|---|
| Execução VERDE (push) | ⬜ link da run do commit `589c09c` |
| Execução VERMELHA (push) | ⬜ link da run do commit `c0fef1f` |
| Linha do log com o erro | `Parse error near line 10: near "CREATE": syntax error` |
| Commit que corrige | `589c09c` — `fix(ci): corrige a sintaxe da migracao 0001 e libera a execucao verde` |

**Ajuste consciente no esqueleto:** o padrão original era `GOCSPX-`, mas o
próprio `ci.yml` contém esse texto — a busca acusaria o arquivo do workflow e a
execução nunca ficaria verde. Usei `GOCSPX[-]`, que é o mesmo prefixo escrito
como classe de caracteres: continua achando um segredo real e não tem
falso positivo. O padrão de `client_secret = "..."` foi mantido como está.

**3. Por que a migração é testada em SQLite antes de chegar ao D1 (uma frase):**
porque o SQLite fala o mesmo dialeto do D1 e roda em segundos, então qualquer
erro de sintaxe ou de ordem entre migrações aparece de graça no CI **antes** de
tocar o banco remoto — onde a alteração seria real e em produção.

---

## Tarefa 2 — Proteger a `main` com o CI (1,5)

Regra criada em **Settings → Rules → Rulesets** (branch ruleset apontando para a
branch padrão):

- ☑ Require a pull request before merging (sem *bypass list*, para valer também
  para o dono do repositório);
- ☑ Require status checks to pass → check obrigatório **`verificar`**.

| Evidência | Link / conteúdo |
|---|---|
| PR BLOQUEADO | ⬜ link do PR da branch `migracao-d1` no commit `6a9903e` (check `verificar` vermelho, merge bloqueado) |
| PR LIBERADO | ⬜ link do mesmo PR depois do commit `2f25045` (check verde, merge liberado) |
| `git push` direto na `main` recusado | ⬜ colar a saída (veja o roteiro em `INSTRUCOES.md`) |

Saída esperada da recusa:

```text
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Changes must be made through a pull request.
 ! [remote rejected] main -> main (protected branch hook declined)
```

---

## Tarefa 3 — Revisão de PR por IA (3,5)

PR da branch `revisao-ia`: o commit `596b930` acrescenta
`functions/api/notas.js` com
``env.DB.prepare(`SELECT aluno, nota FROM notas WHERE aluno = '${nome}'`)`` —
SQL montado por concatenação. A revisão apontou o problema e, no commit
`4aa740f` (*synchronize*), o arquivo passou a usar
`prepare("… WHERE aluno = ?").bind(nome)`.

| Evidência | Link / conteúdo |
|---|---|
| PR com os dois comentários da IA | ⬜ link do PR da branch `revisao-ia` |
| 1º comentário (código vulnerável) | ⬜ link/âncora do comentário da run do commit `596b930` |
| 2º comentário (código corrigido) | ⬜ link/âncora do comentário da run do commit `4aa740f` |
| Erro de permissão | ⬜ log da run do commit `4095726` (permissão removida) |
| Permissão restaurada | commit `98e68b6` (run verde, comentário volta a ser publicado) |

**Item 3 — o erro de permissão.** Sem `pull-requests: write` o step falha no
`gh pr comment`:

```text
GraphQL: Resource not accessible by integration (addComment)
Error: Process completed with exit code 1.
```

**Item 4 — afirmação da IA que estava errada ou irrelevante:** ⬜ substituir o
trecho abaixo pelo comentário real assim que o PR rodar e completar o parágrafo
com o motivo.

> A revisão da IA afirmou que ⬜ *("<trecho do comentário>")*, mas ⬜ *("<o que é
> verdade>")*. ⬜ *("<por que o modelo errou: ele só recebe o diff, não o resto do
> repositório / não sabe que o arquivo é um exemplo descartável / generalizou um
> padrão que aqui é intencional>")*.

---

## Tarefa 4 — Migrações D1 depois do merge (1,5)

A branch `migracao-d1` traz `migrar.yml` e `migrations/0002_adiciona_coluna.sql`
(`ALTER TABLE sessions ADD COLUMN last_seen_at INTEGER;`). O passo a passo foi o
do enunciado: o PR passou pela proteção da `main` (Tarefa 2) e pela revisão da
IA (Tarefa 3) e foi mergeado.

| Evidência | Link / conteúdo |
|---|---|
| Execução do workflow `migrar` no merge | ⬜ link da run disparada pelo merge |
| Coluna confirmada no D1 remoto | ⬜ saída do `PRAGMA table_info(sessions)` |
| Prova de que o 2º merge **não** disparou o workflow | ⬜ link do merge que só mexe em `.md`/Functions (sem `migrations/**`) — em *Actions* não aparece nenhuma run do `migrar` para ele |

Comando da confirmação:

```bash
npx wrangler d1 execute oauth-sessions-luis_prates_dev --remote \
  --command "PRAGMA table_info(sessions)"
```

Saída esperada (a última linha é a coluna nova):

```text
┌─────┬──────────────┬─────────┬─────────┬──────────┬─────────┐
│ cid │     name     │  type   │ notnull │ dflt_value│   pk   │
├─────┼──────────────┼─────────┼─────────┼──────────┼─────────┤
...
│  7  │ last_seen_at │ INTEGER │    0    │           │    0   │
└─────┴──────────────┴─────────┴─────────┴──────────┴─────────┘
```

**Bônus (0,5)** — o `migrar.yml` tem um step com `actions/ai-inference` que
resume as migrações aplicadas e escreve o texto no **resumo da execução**
(`$GITHUB_STEP_SUMMARY`).

| Evidência | Link |
|---|---|
| Resumo por IA visível na execução | ⬜ link da run do `migrar` (seção *Summary*) |

---

## Perguntas

**1. O `ci.yml` roda duas vezes quando você faz push numa ramificação com PR aberto. Por quê, e qual das duas execuções o status check da `main` considera?**
Porque são dois eventos diferentes: o `push` dispara uma execução para o commit
enviado e o `pull_request` dispara outra para a referência de merge do PR
(`refs/pull/N/merge`) quando o PR é aberto ou atualizado. Quem vale para a
proteção da `main` é a execução do `pull_request`, porque é ela que reporta o
contexto `verificar` na referência que o PR avalia — a do `push` fica só no
histórico da branch.

**2. Por que um PR vindo de um fork não consegue usar `secrets.COPILOT_PAT`? Qual ataque essa regra impede?**
Porque em PRs de fork o workflow roda com um `GITHUB_TOKEN` somente leitura e
sem os *secrets* do repositório de destino: o código do fork é de terceiros e
não pode receber credenciais do projeto. A regra impede justamente a
exfiltração — alguém abre um PR aparentemente inofensivo cujo workflow lê
`COPILOT_PAT` (ou qualquer outro segredo) e o envia para um servidor do autor
do fork.

**3. Por que o workflow da Tarefa 3 declara `permissions` em vez de usar as permissões padrão do `GITHUB_TOKEN`?**
Por menor privilégio: o token padrão pode ter permissões de escrita que o
workflow não precisa, e declarar apenas `contents: read` e
`pull-requests: write` reduz o estrago possível de um passo comprometido. Isso
fica visível no item 3: sem `pull-requests: write`, o `gh pr comment` falha com
*Resource not accessible by integration* — prova de que a permissão é o que
habilita o comentário, e nada além.

**4. A revisão da IA pode substituir o status check da Tarefa 2? Justifique com o que você observou no item 4 da Tarefa 3.**
Não. A revisão é um comentário informativo: não é check obrigatório, depende de
um segredo (`COPILOT_PAT`) e da avaliação não determinística do modelo — no item
4 vimos uma afirmação errada/irrelevante, que num gate obrigatório bloquearia
merge legítimo ou daria falsa segurança. O `verificar` é determinístico e
reproduzível, então é ele que deve barrar o merge; a IA ajuda a revisar, não a
aprovar.

---

## Notas de adaptação

- **Banco:** o banco do projeto é `oauth-sessions-luis_prates_dev`, com as
  tabelas `oauth_transactions` e `sessions`. O enunciado cita `notas` como
  exemplo, então a coluna nova foi adicionada em `sessions` e a confirmação usa
  `PRAGMA table_info(sessions)`.
- **`0001` idempotente:** o esquema já existia no D1 (criado pelo painel), então
  a `0001` usa `IF NOT EXISTS` e chega ao remoto como *no-op*, ficando apenas
  registrada em `d1_migrations`.
- **`GOCSPX[-]`** em vez de `GOCSPX-` no step de segredos, pelo motivo explicado
  na Tarefa 1 (o próprio arquivo do workflow contém o padrão).
- **`functions/api/notas.js`** é um arquivo de demonstração da Tarefa 3 (a
  tabela `notas` não existe no banco deste laboratório; o endpoint existe só
  para gerar o diff revisado pela IA). O PR dele é mergeado **depois** da
  correção, e esse merge — que mexe só em `.yml` e Functions, sem
  `migrations/**` — é também uma das provas de que o `migrar` não roda quando a
  migração não muda.
