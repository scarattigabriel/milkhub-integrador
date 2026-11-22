import "../styles/leite.css";
import { useCallback, useState } from "react";
import service from "../services/leite.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, EstadoConsulta } from "../components/Modulo.jsx";
import PeriodoMensal from "../components/PeriodoMensal.jsx";
import { GraficoColunas } from "../components/Graficos.jsx";
import { dataCivil, moeda, numero } from "../utils/formatacao.js";
import { periodoInicial } from "../utils/leiteFinanceiro.js";

// Carregar as coletas, os volumes e o fechamento do mês
export default function Leite({ gestor, referencia }) {
    const [periodo, setPeriodo] = useState(referencia || periodoInicial);
    const [exclusao, setExclusao] = useState(null);
    const gravacao = useGravacao();
    const consulta = useConsulta(useCallback(async signal => { const [resumo, coletas] = await Promise.all([service.resumo(periodo, signal), service.coletas(periodo, signal)]); return { resumo, coletas }; }, [periodo]));
    const resumo = consulta.dados?.resumo;
    return <main className="conteudo-dashboard pagina-leite"><CabecalhoModulo titulo="Coleta de leite" descricao="Registre os volumes coletados e acompanhe as referências mensais.">{gestor && <a className="botao-primario" href="#/leite/coletas/nova">Registrar coleta</a>}</CabecalhoModulo>
        <PeriodoMensal valor={periodo} onAplicar={setPeriodo} carregando={consulta.carregando} />
        {gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}<EstadoConsulta consulta={consulta} />
        {resumo && <><section className="indicadores" aria-label="Resumo do leite"><article className="indicador"><h2>Volume coletado</h2><strong>{numero(resumo.totalLitros)} L</strong></article><article className="indicador"><h2>Coletas registradas</h2><strong>{resumo.quantidadeColetas}</strong></article><article className="indicador"><h2>Valor mensal do leite</h2><strong>{resumo.valorTotalLeite === null ? "Não informado" : moeda(resumo.valorTotalLeite)}</strong></article></section>
            <div className="painel acoes-modulo"><span>Referência {resumo.periodo.mes}/{resumo.periodo.ano}</span>{resumo.fechamento ? <a className="botao-secundario" href={`#/leite/fechamentos/${resumo.fechamento.codFechamento}`}>Abrir fechamento e qualidade</a> : gestor ? <button className="botao-secundario" disabled={gravacao.salvando} onClick={() => gravacao.executar(() => service.criarFechamento({ mesReferencia: periodo.mes, anoReferencia: periodo.ano }), f => navegar(`/leite/fechamentos/${f.codFechamento}`))}>Criar referência mensal</button> : <p>Nenhum fechamento cadastrado.</p>}</div>
            <div className="espaco-acima"><GraficoColunas titulo="Volume coletado por dia" descricao={`${dataCivil(resumo.periodo.de)} a ${dataCivil(resumo.periodo.ate)}`} dados={resumo.porDia.map(d => ({ nome: d.data.slice(8), valor: d.volumeLitros }))} mensagemVazia="Nenhum volume de leite registrado neste mês." /></div>
            {exclusao && <section className="painel confirmar-exclusao espaco-acima"><h2>Excluir a coleta de {dataCivil(exclusao.dataColeta)}?</h2><p>{numero(exclusao.volumeLitros)} L. Os totais serão recalculados; o valor manual do fechamento será preservado.</p><div className="acoes-modulo"><button className="botao-perigo" disabled={gravacao.salvando} onClick={() => gravacao.executar(() => service.excluirColeta(exclusao.codColeta), () => { setExclusao(null); consulta.recarregar(); })}>Confirmar exclusão</button><button className="botao-secundario" disabled={gravacao.salvando} onClick={() => setExclusao(null)}>Cancelar</button></div></section>}
            <section className="painel espaco-acima"><h2 className="titulo-secao">Coletas do mês</h2>{consulta.dados.coletas.length ? <div className="tabela-rolagem" role="region" tabIndex="0" aria-label="Tabela com rolagem horizontal"><table className="tabela-modulo"><thead><tr><th>Data</th><th>Horário (Brasília)</th><th>Litros</th><th>Alizarol</th><th>Observação</th>{gestor && <th>Ações</th>}</tr></thead><tbody>{consulta.dados.coletas.map(c => <tr key={c.codColeta}><td>{dataCivil(c.dataColeta)}</td><td>{c.horarioColeta?.slice(0, 5) || "Não informado"}</td><td>{numero(c.volumeLitros)}</td><td>{c.resultadoAlizarol || "Não realizado"}</td><td className="texto-longo">{c.observacao || "—"}</td>{gestor && <td className="acoes-tabela"><a href={`#/leite/coletas/${c.codColeta}/editar`}>Editar</a><button className="botao-texto" disabled={gravacao.salvando} onClick={() => setExclusao(c)}>Excluir</button></td>}</tr>)}</tbody></table></div> : <p className="texto-vazio">Nenhuma coleta registrada neste mês.</p>}</section>
        </>}
    </main>;
}
