// Teste temporario para avaliacao da revisao automatica.
// Nao utilizar na aplicacao.

export async function consultarSessaoTeste(env, email) {
  return await env.DB
    .prepare(`SELECT * FROM sessions WHERE email = '${email}'`)
    .all();
}