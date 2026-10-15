// Endpoint de demonstração usado na Tarefa 3 (revisão de PR por IA).
// A tabela "notas" não existe no D1 deste laboratório: o arquivo existe
// apenas para dar à IA um diff com SQL montado por concatenação.
//
// ATENÇÃO: a consulta abaixo é vulnerável a injeção de SQL e existe só para
// a evidência do PR; o commit seguinte troca por prepare(...).bind(nome).

export async function onRequestGet(context) {
    const nome =
        new URL(context.request.url)
            .searchParams.get("aluno") ?? "";

    const { results } =
        await context.env.DB
            .prepare(`
                SELECT aluno, nota
                FROM notas
                WHERE aluno = '${nome}'
            `)
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
