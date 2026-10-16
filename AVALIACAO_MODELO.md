# Avaliação — GitHub Actions com IA | oauth-lab

**Repositório:** https://github.com/LuisPratesDev/oauth-lab  
**Responsável(is):** Luis Fernando Prates Santana e João Vitor Nascimento Martins
**Turma:** 2ESBN

> **Modelo para conclusão após executar os testes.** Os campos [COLOCAR LINK] e os relatos devem ser confirmados nos logs reais. Não apresente este arquivo como evidência de execução antes de preencher.

## 1. Validação contínua (CI)

O workflow `.github/workflows/ci.yml` acompanha os eventos `push` e `pull_request` e executa três verificações: busca de possíveis segredos, aplicação das migrações em SQLite local e validação do HTML. O erro proposital de SQL deve ser registrado antes da correção, para demonstrar que a execução realmente interrompe a integração.

- Execução aprovada: [COLOCAR LINK DA RUN VERDE]
- Execução com falha proposital: [COLOCAR LINK DA RUN VERMELHA]
- Linha relevante do log e explicação: [PREENCHER]

**Por que testar no SQLite primeiro?** O teste local detecta erros de sintaxe ou de sequência das migrações antes que os comandos cheguem ao banco D1 remoto, reduzindo o risco de falhas na implantação.

## 2. Proteção da branch principal

A regra aplicada à `main` exige Pull Request e o job `verificar` aprovado para liberar o merge. Além de mostrar um PR bloqueado por erro e liberado após a correção, também é necessário provar a recusa do `git push` direto.

- Pull Request com bloqueio e posterior liberação: [COLOCAR LINK]
- Push recusado (trecho de saída GH013 ou equivalente): [COLOCAR TEXTO OU LINK DE EVIDÊNCIA]

## 3. Análise automatizada por IA

O workflow `.github/workflows/revisao-ia.yml` usa `actions/ai-inference` com autenticação guardada no secret `COPILOT_PAT`, analisa o diff e publica um comentário no PR. O teste inclui uma consulta propositalmente vulnerável e sua correção com `prepare(...).bind(...)`.

- Primeiro comentário identificando SQL vulnerável: [COLOCAR LINK DIRETO DO COMENTÁRIO]
- Segundo comentário após a correção: [COLOCAR LINK DIRETO DO COMENTÁRIO]
- Execução que falhou sem `pull-requests: write`: [COLOCAR LINK DA RUN]
- Erro da publicação do comentário: [COPIAR TRECHO EXATO DO LOG]

### Avaliação crítica da resposta da IA

[PREENCHER COM UMA AFIRMAÇÃO REALMENTE ERRADA OU IRRELEVANTE DA IA E JUSTIFICAR COM O DIFF/CONTEXTO. Não apresentar riscos de segurança condicionais como “falsos positivos” sem fundamentação. Caso a IA não tenha produzido um achado equivocado, realize um teste adicional e documente a conclusão.]

## 4. Implantação de migrações no Cloudflare D1

O workflow `.github/workflows/migrar.yml` executa o Wrangler somente após `push` na `main` que altera a pasta `migrations/`. Neste repositório, a segunda migração adiciona `last_seen_at INTEGER` à tabela `sessions`; o banco se chama `oauth-sessions-luis_prates_dev`.

- Pull Request contendo a migração: [COLOCAR LINK]
- Run que aplicou as migrações remotamente: [COLOCAR LINK]
- Resultado da consulta `PRAGMA table_info(sessions);`, mostrando `last_seen_at`: [COLAR RESULTADO OU LINK]
- PR de alteração apenas no README: [COLOCAR LINK]
- Evidência de que `Migrar D1` não executou novamente: [COLOCAR LINK PARA O HISTÓRICO E DESCREVER A COMPARAÇÃO]
- (Bônus, se realizado) link do resumo por IA em `$GITHUB_STEP_SUMMARY`: [COLOCAR LINK]

## 5. Respostas às perguntas

**1. Por que o CI executa duas vezes em um push feito numa branch com PR aberto? Qual execução é considerada na proteção da `main`?**  
O workflow escuta dois eventos diferentes: `push`, quando um commit é enviado, e `pull_request`, quando o PR é atualizado. Na proteção da `main`, o GitHub verifica o status exigido `verificar` associado ao PR e, havendo um commit de merge de teste, dá preferência aos resultados desse commit para decidir se o merge pode ser realizado.

**2. Por que um PR vindo de fork não recebe `secrets.COPILOT_PAT`? O que essa restrição impede?**  
O GitHub não disponibiliza automaticamente segredos do repositório de destino a workflows de PRs provenientes de forks não confiáveis. Isso evita que alguém altere o código ou o workflow no fork para executar comandos que roubem o token e outras credenciais.

**3. Por que declarar `permissions` no workflow da IA?**  
Para conceder ao `GITHUB_TOKEN` somente os acessos necessários: leitura do código e permissão para comentar no PR. O teste sem `pull-requests: write` demonstra que executar a análise não é suficiente: a publicação do comentário também depende de autorização.

**4. A revisão por IA substitui o status check obrigatório da proteção da `main`?**  
Não: o CI produz uma aprovação ou reprovação verificável para as regras definidas, enquanto a IA fornece uma avaliação interpretativa que pode omitir problemas ou fazer observações inadequadas ao contexto. O teste de permissões também mostra que a revisão pode deixar de publicar resultados mesmo quando o CI continua funcionando normalmente.
