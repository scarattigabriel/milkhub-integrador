import "../styles/financeiro.css";
import { useCallback, useState } from "react";
import service from "../services/financeiro.service.js";
import useConsulta from "../hooks/useConsulta.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import Abas from "../components/AbasFinanceiro.jsx";
import { GraficoBarras } from "../components/Graficos.jsx";
import { meses, moeda } from "../utils/formatacao.js";
import { periodoInicial, prepararPeriodoFinanceiro } from "../utils/leiteFinanceiro.js";
const coresFinanceiro = ["#70452f", "#ad7954", "#82705e", "#c19a65", "#96704f", "#d1b99b"];
// Escolher a cor conforme o saldo seja positivo ou negativo
const corSaldo = saldo => Number(saldo) < 0 ? "valor-negativo" : Number(saldo) > 0 ? "valor-positivo" : undefined;

// Carregar e mostrar o resumo financeiro do período
export default function FinanceiroResumo() {
    const [f, setF] = useState({ ...periodoInicial(), modo: "mes", de: "", ate: "" });
    const [periodo, setPeriodo] = useState(periodoInicial);
    const [erro, setErro] = useState("");
    const consulta = useConsulta(useCallback(signal => service.resumo(periodo, signal), [periodo]));
    // Atualizar o campo preenchido no formulário
    const alterar = e => setF(v => ({ ...v, [e.target.name]: e.target.value }));
    // Aplicar os filtros preenchidos na consulta
    function filtrar(e) { e.preventDefault(); try { setPeriodo(prepararPeriodoFinanceiro(f)); setErro(""); } catch (falha) { setErro(falha.message); } }
    const r = consulta.dados;
    return <main className="conteudo-dashboard pagina-financeiro"><CabecalhoModulo titulo="Resumo financeiro" descricao="Receitas pela data de recebimento, custos e saldo do período." /><Abas tipo="resumo" />
        <form className="painel filtros-modulo" onSubmit={filtrar}><Campo titulo="Filtro"><select name="modo" value={f.modo} onChange={alterar}><option value="mes">Mês e ano</option><option value="intervalo">Intervalo de datas</option></select></Campo>
            {f.modo === "mes" ? <><Campo titulo="Mês"><select name="mes" value={f.mes} onChange={alterar}>{meses.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></Campo><Campo titulo="Ano"><input name="ano" type="number" min="1" max="9999" required value={f.ano} onChange={alterar} /></Campo></> : <><Campo titulo="De *"><input name="de" type="date" min="0001-01-01" max="9999-12-31" required value={f.de} onChange={alterar} /></Campo><Campo titulo="Até *"><input name="ate" type="date" min="0001-01-01" max="9999-12-31" required value={f.ate} onChange={alterar} /></Campo></>}
            <button className="botao-primario" disabled={consulta.carregando}>Atualizar resumo</button></form>
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}<EstadoConsulta consulta={consulta} />{r && <>
            <section className="indicadores"><article className="indicador"><h2>Receitas</h2><strong className="valor-positivo">{moeda(r.totalReceitas)}</strong></article><article className="indicador"><h2>Custos</h2><strong className="valor-negativo">{moeda(r.totalCustos)}</strong></article><article className="indicador"><h2>Saldo</h2><strong className={corSaldo(r.saldo)}>{moeda(r.saldo)}</strong></article></section>
            <div className="grade-graficos"><GraficoBarras exibirTabela={false} titulo="Receitas por tipo" descricao="Valores recebidos no período" dados={r.receitasPorTipo.map((t, i) => ({ nome: t.nome, valor: t.valor, cor: coresFinanceiro[i % coresFinanceiro.length] }))} formatar={moeda} mensagemVazia="Nenhuma receita no período." /><GraficoBarras exibirTabela={false} titulo="Custos por tipo" descricao="Despesas realizadas no período" dados={r.custosPorTipo.map((t, i) => ({ nome: t.nome, valor: t.valor, cor: coresFinanceiro[i % coresFinanceiro.length] }))} formatar={moeda} mensagemVazia="Nenhum custo no período." /></div>
            <section className="painel"><h2 className="titulo-secao">Evolução mensal</h2><div className="tabela-rolagem" role="region" tabIndex="0" aria-label="Tabela com rolagem horizontal"><table className="tabela-modulo"><thead><tr><th>Mês</th><th>Receitas</th><th>Custos</th><th>Saldo</th></tr></thead><tbody>{r.porMes.map(m => <tr key={m.referencia}><th scope="row">{m.referencia.slice(5)}/{m.referencia.slice(0, 4)}</th><td className="valor-positivo">{moeda(m.receitas)}</td><td className="valor-negativo">{moeda(m.custos)}</td><td className={corSaldo(m.saldo)}>{moeda(m.saldo)}</td></tr>)}</tbody></table></div></section>
        </>}
    </main>;
}
