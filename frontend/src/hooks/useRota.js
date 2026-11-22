import { useSyncExternalStore } from "react";

// Acompanhar mudanças no endereço da página
function inscrever(callback) {
    window.addEventListener("hashchange", callback);
    return () => window.removeEventListener("hashchange", callback);
}

// Descobrir qual tela corresponde ao endereço atual
export function resolverRota(hash) {
    const caminho = hash.replace(/^#/, "") || "/dashboard";
    if (caminho === "/usuarios") return { pagina: "usuarios", gestor: true };
    if (caminho === "/usuarios/novo") return { pagina: "usuario-form", gestor: true };
    const usuario = caminho.match(/^\/usuarios\/([1-9]\d*)\/(editar|senha)$/);
    if (usuario && Number(usuario[1]) <= 2147483647) return { pagina: usuario[2] === "senha" ? "usuario-senha" : "usuario-form", codigo: usuario[1], gestor: true };
    if (["/financeiro", "/financeiro/resumo"].includes(caminho)) return { pagina: "financeiro-resumo", gestor: true };
    const detalheLancamento = caminho.match(/^\/financeiro\/(custos|receitas)\/([1-9]\d*)$/);
    if (detalheLancamento && Number(detalheLancamento[2]) <= 2147483647) return { pagina: "financeiro-detalhe", tipo: detalheLancamento[1], codigo: detalheLancamento[2], gestor: true };
    const financeiro = caminho.match(/^\/financeiro\/(custos|receitas|fornecedores|tipos-custo|tipos-receita)$/);
    if (financeiro) return { pagina: ["custos", "receitas"].includes(financeiro[1]) ? "financeiro-lista" : "financeiro-catalogo", tipo: financeiro[1], gestor: true };
    const novoLancamento = caminho.match(/^\/financeiro\/(custos|receitas)\/novo$/);
    if (novoLancamento) return { pagina: "financeiro-form", tipo: novoLancamento[1], gestor: true };
    const editarLancamento = caminho.match(/^\/financeiro\/(custos|receitas)\/([1-9]\d*)\/editar$/);
    if (editarLancamento && Number(editarLancamento[2]) <= 2147483647) return { pagina: "financeiro-form", tipo: editarLancamento[1], codigo: editarLancamento[2], gestor: true };
    const periodoFinanceiro = caminho.match(/^\/financeiro\/(custos|receitas)\/(\d{4})-(0[1-9]|1[0-2])$/);
    if (periodoFinanceiro && Number(periodoFinanceiro[2]) > 0) return { pagina: "financeiro-lista", tipo: periodoFinanceiro[1], referencia: { ano: Number(periodoFinanceiro[2]), mes: Number(periodoFinanceiro[3]) }, gestor: true };
    if (caminho === "/leite") return { pagina: "leite" };
    const mesLeite = caminho.match(/^\/leite\/(\d{4})-(0[1-9]|1[0-2])$/);
    if (mesLeite && Number(mesLeite[1]) > 0) return { pagina: "leite", referencia: { ano: Number(mesLeite[1]), mes: Number(mesLeite[2]) } };
    if (caminho === "/leite/coletas/nova") return { pagina: "leite-coleta-form", gestor: true };
    const coleta = caminho.match(/^\/leite\/coletas\/([1-9]\d*)\/editar$/);
    if (coleta && Number(coleta[1]) <= 2147483647) return { pagina: "leite-coleta-form", codigo: coleta[1], gestor: true };
    const fechamento = caminho.match(/^\/leite\/fechamentos\/([1-9]\d*)$/);
    if (fechamento && Number(fechamento[1]) <= 2147483647) return { pagina: "leite-fechamento", codigo: fechamento[1] };
    if (caminho === "/reprodutores") return { pagina: "reprodutores" };
    if (caminho === "/reproducao") return { pagina: "reproducao" };
    if (["/reproducao/diagnosticos", "/reproducao/gestacoes", "/reproducao/secagens", "/reproducao/partos"].includes(caminho)) return { pagina: "reproducao", tipo: caminho.split("/")[2] };
    const evento = caminho.match(/^\/reproducao\/(secagens|partos)\/nova(?:\/([1-9]\d*))?$/);
    if (evento && (!evento[2] || Number(evento[2]) <= 2147483647)) return { pagina: "repro-evento-form", tipo: evento[1], origem: evento[2], gestor: true };
    const perda = caminho.match(/^\/reproducao\/gestacoes\/([1-9]\d*)\/perda$/);
    if (perda && Number(perda[1]) <= 2147483647) return { pagina: "repro-evento-form", tipo: "perdas", origem: perda[1], gestor: true };
    const diagnostico = caminho.match(/^\/reproducao\/diagnosticos\/nova(?:\/([1-9]\d*))?$/);
    if (diagnostico && (!diagnostico[1] || Number(diagnostico[1]) <= 2147483647)) return { pagina: "repro-diagnostico-form", origem: diagnostico[1], gestor: true };
    if (caminho === "/reproducao/gestacoes/nova") return { pagina: "repro-gestacao-form", gestor: true };
    const gestacao = caminho.match(/^\/reproducao\/gestacoes\/([1-9]\d*)(?:\/(editar))?$/);
    if (gestacao && Number(gestacao[1]) <= 2147483647) return { pagina: gestacao[2] ? "repro-gestacao-form" : "repro-gestacao-detalhe", codigo: gestacao[1], gestor: Boolean(gestacao[2]) };
    if (caminho === "/reproducao/inseminacoes/nova") return { pagina: "inseminacao-form", gestor: true };
    const inseminacao = caminho.match(/^\/reproducao\/inseminacoes\/([1-9]\d*)$/);
    if (inseminacao && Number(inseminacao[1]) <= 2147483647) return { pagina: "inseminacao-detalhe", codigo: inseminacao[1] };
    if (["/dashboard", "/animais", "/medicamentos", "/atividades", "/carencias"].includes(caminho)) return { pagina: caminho.slice(1) };
    const carencias = caminho.match(/^\/carencias\/([1-9]\d*)$/);
    if (carencias && Number(carencias[1]) <= 2147483647) return { pagina: "carencias", codigo: carencias[1] };
    if (caminho === "/atividades/nova") return { pagina: "atividade-form", gestor: true };
    const atividade = caminho.match(/^\/atividades\/([1-9]\d*)(?:\/(editar|concluir))?$/);
    if (atividade && Number(atividade[1]) <= 2147483647) return { pagina: atividade[2] === "concluir" ? "atividade-conclusao" : atividade[2] ? "atividade-form" : "atividade-detalhe", codigo: atividade[1], gestor: Boolean(atividade[2]) };
    if (caminho === "/animais/novo") return { pagina: "animal-form", gestor: true };
    const animal = caminho.match(/^\/animais\/([1-9]\d*)(?:\/(editar|saida))?$/);
    if (animal && Number(animal[1]) <= 2147483647) return {
        pagina: animal[2] === "editar" ? "animal-form" : animal[2] === "saida" ? "animal-saida" : "animal-detalhe",
        codigo: animal[1], gestor: Boolean(animal[2]),
    };
    return { pagina: "nao-encontrada" };
}

// Acompanhar o endereço e devolver a tela que deve abrir
export default function useRota() {
    const hash = useSyncExternalStore(inscrever, () => window.location.hash, () => "");
    return { ...resolverRota(hash), chave: hash };
}

// Trocar o endereço para abrir outra tela
export function navegar(caminho) { window.location.hash = caminho; }
