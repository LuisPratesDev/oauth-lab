# Testes de Falha

## Caso 1 — Retorno sem cookie temporário

**Preparação:**  
Foi iniciado o login com o Google em uma janela comum e o fluxo foi interrompido na página do provedor. A URL de autorização foi utilizada em uma segunda janela que não possuía o cookie temporário `__Host-oauth-tx`.

**Pedido enviado:**  
Foi concluído o processo de autenticação do Google na segunda janela, fazendo com que o provedor retornasse a resposta OAuth para a aplicação sem o cookie temporário associado à transação.

**Resultado esperado:**  
A rota de retorno deveria recusar a resposta por ausência do cookie temporário e não deveria criar uma sessão local.

**Resultado observado:**  
**PASSOU.** A aplicação recusou o retorno quando o cookie temporário não estava presente e não criou uma sessão.

---

## Caso 2 — State alterado

**Preparação:**  
Foi iniciado um novo fluxo de login com o Google. O fluxo foi interrompido antes da conclusão da autenticação e um único caractere do parâmetro `state` foi alterado. O valor alterado não foi registrado nas evidências.

**Pedido enviado:**  
Foi prosseguida a autenticação no Google utilizando o `state` alterado. O retorno foi enviado para a rota `/oauth/callback/google`.

**Resultado esperado:**  
A rota de retorno deveria identificar que o `state` recebido não correspondia ao `state` armazenado na transação e recusar a resposta antes da troca do código de autorização.

**Resultado observado:**  
**PASSOU.** O callback real foi identificado e respondeu com HTTP 400, recusando o retorno com o `state` alterado antes da conclusão do fluxo.

---

## Caso 3 — Reutilização da transação

**Preparação:**  
Foi realizado um login normal utilizando o Google. Durante o fluxo, a transação OAuth temporária foi preservada internamente apenas para permitir a repetição controlada do callback.

**Pedido enviado:**  
Após a conclusão do login, a mesma URL de callback OAuth foi reutilizada, restaurando temporariamente o cookie de transação para garantir que a requisição pudesse chegar à validação da transação no servidor.

**Resultado esperado:**  
A segunda tentativa deveria ser recusada, pois a transação OAuth já havia sido utilizada e removida antes da conclusão do primeiro fluxo.

**Resultado observado:**  
**PASSOU.** O primeiro callback retornou HTTP 302 e concluiu o login. Na segunda tentativa, o callback retornou HTTP 400 com rejeição da transação OAuth, confirmando que a transação não pôde ser reutilizada.

---

## Caso 4 — Sessão expirada

**Preparação:**  
Foi criada uma sessão de teste no ambiente do laboratório.

**Pedido enviado:**  
No console do D1 foi executado o comando:

```sql
UPDATE sessions SET expires_at = 0;
```

Em seguida, a página foi recarregada e o endpoint `/api/me` foi verificado.

**Resultado esperado:**  
O endpoint `/api/me` deveria rejeitar a sessão expirada e responder com HTTP 401.

**Resultado observado:**  
**PASSOU.** O endpoint `/api/me` respondeu `Unauthorized` (HTTP 401), confirmando que a sessão expirada não é aceita.

---

## Caso 5 — Origem inválida na saída

**Preparação:**  
Foi criada uma sessão válida no ambiente de produção do laboratório.

**Pedido enviado:**  
A partir da origem `https://example.com`, foi enviado um `POST` para `/oauth/logout` com `credentials: "include"`.

**Resultado esperado:**  
A rota deveria recusar a operação devido à origem inválida, mantendo a sessão original válida.

**Resultado observado:**  
**PASSOU.** A tentativa de logout foi recusada com HTTP 403 (`Forbidden`). O navegador bloqueou a leitura da resposta devido à política de CORS. Ao retornar à origem do laboratório, a sessão permaneceu válida, confirmando que o logout não removeu a sessão.

---

## Caso 6 — Reutilização de cookie de sessão revogado

**Preparação:**  
Foi criada uma sessão válida no ambiente do laboratório e o valor completo do cookie `__Host-session` foi copiado temporariamente apenas para a realização do teste.

**Pedido enviado:**  
Foi realizado o logout normalmente, invalidando a sessão no servidor. Em seguida, o cookie de sessão antigo foi restaurado temporariamente no navegador e o endpoint `/api/me` foi consultado novamente.

**Resultado esperado:**  
O endpoint `/api/me` deveria rejeitar o cookie antigo e responder com HTTP 401, pois a sessão correspondente já foi revogada no servidor.

**Resultado observado:**  
**PASSOU.** Após a restauração do cookie de sessão antigo, o endpoint `/api/me` respondeu `401 Unauthorized`, confirmando que a posse de um cookie de sessão previamente revogado não é suficiente para restaurar o acesso.