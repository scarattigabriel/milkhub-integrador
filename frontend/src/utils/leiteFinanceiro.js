import { filtrosIniciais } from "./formatacao.js";
import { validarDataEvento } from "./reproducao.js";

// Escolher o mês e o ano iniciais da consulta
export function periodoInicial() { const { mes, ano } = filtrosIniciais(); return { mes, ano }; }
// Montar o endereço mantendo o período selecionado
export function rotaPeriodo(raiz, data) { return `${raiz}/${data.slice(0, 7)}`; }
// Conferir e padronizar o número decimal do formulário
export function decimalFormulario(valor, inteiros = 10) {
    const texto = String(valor ?? "").trim().replace(",", ".");
    if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) throw new Error("Informe um valor não negativo com até duas casas decimais, sem separador de milhar.");
    const [parte, fracao = ""] = texto.split(".");
    const normalizada = parte.replace(/^0+(?=\d)/, "");
    if (normalizada.length > inteiros) throw new Error("O valor informado excede o limite permitido.");
    return `${normalizada}.${fracao.padEnd(2, "0")}`;
}
// Conferir e organizar os dados da coleta de leite
export function prepararColeta(f) {
    return { dataColeta: validarDataEvento(f.dataColeta), volumeLitros: decimalFormulario(f.volumeLitros, 8),
        horarioColeta: f.horarioColeta || null, resultadoAlizarol: f.resultadoAlizarol.trim() || null, observacao: f.observacao.trim() || null };
}
// Conferir e organizar os dados do fechamento mensal
export function prepararFechamento(f) {
    return { valorTotalLeite: f.valorTotalLeite.trim() ? decimalFormulario(f.valorTotalLeite, 12) : null, observacao: f.observacao.trim() || null };
}
// Conferir os campos do tipo ou fornecedor
export function prepararCatalogo(tipo, f) {
    const nome = f.nome.trim(), limite = tipo === "fornecedores" ? 150 : 100;
    if (!nome || nome.length > limite) throw new Error(`Informe um nome de até ${limite} caracteres.`);
    return { nome, ...(tipo === "fornecedores" ? { contato: f.contato.trim() || null } : {}) };
}
// Conferir e organizar os dados do custo ou da receita
export function prepararLancamento(tipo, f, original = null) {
    const custo = tipo === "custos", descricao = f.descricao.trim();
    if (!descricao || descricao.length > 255 || !f.codTipo) throw new Error("Informe a descrição e selecione o tipo do lançamento.");
    const dados = { descricao, [custo ? "dataCusto" : "dataReceita"]: validarDataEvento(f.data), [custo ? "codTipoCusto" : "codTipoReceita"]: Number(f.codTipo) };
    if (custo) dados.codFornecedor = f.codFornecedor ? Number(f.codFornecedor) : null;
    const vinculado = !custo && (original?.codFechamento || (!original && f.codFechamento));
    if (vinculado) { if (!original) dados.codFechamento = Number(f.codFechamento); }
    else dados.valor = decimalFormulario(f.valor, 10);
    return dados;
}
// Conferir os dados e o arquivo antes de anexar
export function prepararAnexo(f, alvo) {
    const dados = { ...alvo, tipoDocumento: f.tipoDocumento, ...(f.descricao.trim() ? { descricao: f.descricao.trim() } : {}) };
    if (alvo.codFechamento && f.tipoDocumento === "CONTRANOTA") {
        if (f.atualizarValor) dados.valorTotalLeite = decimalFormulario(f.valorTotalLeite, 12);
        if (f.contabilizar) {
            if (!f.codTipoReceita) throw new Error("Selecione o tipo de receita para contabilizar o leite.");
            dados.codTipoReceita = Number(f.codTipoReceita); dados.dataReceita = validarDataEvento(f.dataReceita);
            if (f.descricaoReceita.trim()) dados.descricaoReceita = f.descricaoReceita.trim();
        }
    }
    return dados;
}
// Conferir e organizar os índices de qualidade do leite
export function prepararQualidade(indices) {
    if (!indices.length || indices.length > 50) throw new Error("Informe entre 1 e 50 índices.");
    const nomes = new Set();
    return indices.map(i => {
        const nome = i.nome.trim(), valor = i.valor.trim(), unidade = i.unidade.trim() || null;
        if (!nome || !valor || nome.length > 100 || valor.length > 100 || (unidade && unidade.length > 30)) throw new Error("Preencha nome e valor dos índices, respeitando os limites dos campos.");
        const chave = nome.toLocaleLowerCase("pt-BR");
        if (nomes.has(chave)) throw new Error("Não repita nomes de índices de qualidade.");
        nomes.add(chave); return { nome, valor, unidade };
    });
}
// Conferir as datas usadas no resumo financeiro
export function prepararPeriodoFinanceiro(f) {
    if (f.modo !== "intervalo") return { mes: Number(f.mes), ano: Number(f.ano) };

    if (!f.de || !f.ate || f.de > f.ate) throw new Error("Informe início e fim, em ordem cronológica.");
    return { de: f.de, ate: f.ate };
}
