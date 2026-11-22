import "../styles/financeiro.css";
import { useCallback, useState } from "react";
import service from "../services/financeiro.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { CabecalhoModulo, EstadoConsulta } from "../components/Modulo.jsx";
import PeriodoMensal from "../components/PeriodoMensal.jsx";
import Abas from "../components/AbasFinanceiro.jsx";
import { periodoInicial } from "../utils/leiteFinanceiro.js";
import { dataCivil, moeda } from "../utils/formatacao.js";
// Listar os lançamentos e permitir filtrar custos ou receitas
export default function FinanceiroLista({ tipo = "custos", referencia }) {
    const [periodo, setPeriodo] = useState(referencia || periodoInicial);
    const [exclusao, setExclusao] = useState(null);
    const gravacao = useGravacao();
    const consulta = useConsulta(useCallback(signal => service.listar(tipo, periodo, signal), [tipo, periodo]));
    const custo = tipo === "custos", chave = custo ? "codCusto" : "codReceita";
    return <main className="conteudo-dashboard pagina-financeiro"><CabecalhoModulo titulo={custo ? "Custos" : "Receitas"} descricao={custo ? "Acompanhe as despesas realizadas na propriedade." : "Acompanhe os valores recebidos pela data de recebimento."}><a className="botao-primario" href={`#/financeiro/${tipo}/novo`}>{custo ? "Registrar custo" : "Registrar receita"}</a></CabecalhoModulo><Abas tipo={tipo} /><PeriodoMensal valor={periodo} onAplicar={setPeriodo} carregando={consulta.carregando} />
        {gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
        {exclusao && <section className="painel confirmar-exclusao"><h2>Excluir o lançamento?</h2><p>{exclusao.descricao} · {moeda(exclusao.valor)}. Comprovantes vinculados precisam ser removidos antes da exclusão.</p><div className="acoes-modulo"><button className="botao-perigo" disabled={gravacao.salvando} onClick={() => gravacao.executar(() => service.excluir(tipo, exclusao[chave]), () => { setExclusao(null); consulta.recarregar(); })}>Confirmar exclusão</button><button className="botao-secundario" disabled={gravacao.salvando} onClick={() => setExclusao(null)}>Cancelar</button></div></section>}
        <EstadoConsulta consulta={consulta} />{consulta.dados && <section className="painel"><p>{consulta.dados.length} lançamentos encontrados</p>{consulta.dados.length ? <div className="tabela-rolagem" role="region" tabIndex="0" aria-label="Tabela com rolagem horizontal"><table className="tabela-modulo"><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th><th>{custo ? "Fornecedor" : "Origem"}</th><th>Ações</th></tr></thead><tbody>{consulta.dados.map(r => <tr key={r[chave]}><td>{dataCivil(custo ? r.dataCusto : r.dataReceita)}</td><th scope="row" className="texto-longo"><a href={`#/financeiro/${tipo}/${r[chave]}`}>{r.descricao}</a></th><td>{(custo ? r.tipoCusto : r.tipoReceita)?.nome || "Não informado"}</td><td>{moeda(r.valor)}</td><td>{custo ? r.fornecedor?.nome || "Não informado" : r.fechamento ? <a href={`#/leite/fechamentos/${r.codFechamento}`}>Leite {r.fechamento.mesReferencia}/{r.fechamento.anoReferencia}</a> : "Receita avulsa"}</td><td className="acoes-tabela"><a href={`#/financeiro/${tipo}/${r[chave]}`}>Comprovantes</a><a href={`#/financeiro/${tipo}/${r[chave]}/editar`}>Editar</a><button className="botao-texto" disabled={gravacao.salvando} onClick={() => setExclusao(r)}>Excluir</button></td></tr>)}</tbody></table></div> : <p>Nenhum lançamento neste período.</p>}</section>}
    </main>;
}
