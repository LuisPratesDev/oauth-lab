// Endpoint de demonstração usado na Tarefa 3 (revisão de PR por IA).
// A tabela "notas" não existe no D1 deste laboratório: o arquivo existe
// apenas para dar à IA um diff sobre o qual comentar.
//
// A primeira versão montava o SQL por concatenação (injeção) e foi apontada
// pela revisão da IA; aqui a consulta usa um parâmetro vinculado, então o
// valor do aluno nunca é interpretado como SQL.

export async function onRequestGet(context) {
    const nome =
        new URL(context.request.url)
            .searchParams.get("aluno") ?? "";

    const { results } =
        await context.env.DB
            .prepare(`
                SELECT aluno, nota
                FROM notas
                WHERE aluno = ?
            `)
            .bind(nome)
            .all();

    return Response.json(
        { results },
        {
            headers: {
                "Cache-Control": "no-store"
            }
        }
    );
}
