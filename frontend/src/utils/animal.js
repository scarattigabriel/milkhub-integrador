// Conferir e organizar os campos do animal antes de enviar
export function prepararAnimal(formulario) {
    const dados = {};
    for (const [campo, limite] of [["nome", 100], ["brinco", 30], ["categoria", 30]]) {
        dados[campo] = formulario[campo].trim();
        if (!dados[campo] || dados[campo].length > limite) throw new Error(`Preencha ${campo} com até ${limite} caracteres.`);
    }
    Object.assign(dados, { sexo: formulario.sexo, dataNascimento: formulario.dataNascimento,
        situacaoLactacao: formulario.sexo === "M" ? "NAO_SE_APLICA" : formulario.situacaoLactacao,
        prenha: formulario.sexo === "M" ? "N" : formulario.prenha });
    for (const campo of ["codRaca", "codAnimalMae", "codParto"]) dados[campo] = formulario[campo] ? Number(formulario[campo]) : null;
    return dados;
}
// Ordenar uma cópia da lista e manter o código como critério de desempate
export function ordenarAnimais(animais, ordem = "nome-asc") {
    const porData = ordem.startsWith("nascimento");
    const direcao = ordem.endsWith("desc") ? -1 : 1;
    return [...animais].sort((a, b) => {
        const comparacao = porData
            ? String(a.dataNascimento).localeCompare(String(b.dataNascimento))
            : a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base", numeric: true });
        return comparacao * direcao || a.codAnimal - b.codAnimal;
    });
}
