import { useEffect, useState } from "react";
import { GraficoLinha } from "../components/Graficos.jsx";
import IdentificacaoAnimal from "../components/IdentificacaoAnimal.jsx";
import dashboardService from "../services/dashboard.service.js";
import obterMensagemErro from "../utils/obterMensagemErro.js";
import { meses, numero, moeda, dataCivil, dataHora, filtrosIniciais, rotulo, identificarAnimal } from "../utils/formatacao.js";
import "../styles/dashboard.css";
import "../styles/dashboard-milkhub.css";

// Mostrar um número importante no painel
function Indicador({ titulo, valor, detalhe, alerta = false }) {
    return <article className={`indicador${alerta ? " indicador-alerta" : ""}`}>
        <h2>{titulo}</h2><strong>{valor}</strong><p>{detalhe}</p>
    </article>;
}

// Mostrar um resumo das atividades com acesso aos detalhes
function ListaAtividades({ atividades, agora }) {
    return <ul className="lista-registros">{atividades.map(a => <li key={a.codAtividade}>
        <div>{agora && <span className={`etiqueta-atividade${new Date(a.dataHoraPrevista) < new Date(agora) ? " etiqueta-atrasada" : ""}`}>{new Date(a.dataHoraPrevista) < new Date(agora) ? "Atrasada" : "Agendada"}</span>}<strong><a href={`#/atividades/${a.codAtividade}`}>{a.titulo}</a></strong><span>{rotulo(a.tipo)} · {dataHora(a.dataHoraPrevista)}</span>
            {!!a.participacoes?.length && <small>{a.participacoes.map(p => identificarAnimal(p.animal)).join("; ")}</small>}
        </div>
    </li>)}</ul>;
}

// Reunir os atrasos, as atividades do dia e os partos próximos
function AtencaoHoje({ dados }) {
    const { agenda, hoje, previsoesReprodutivas } = dados;
    const limiteParto = new Date(`${hoje.data}T12:00:00Z`);
    limiteParto.setUTCDate(limiteParto.getUTCDate() + 30);
    const partos = previsoesReprodutivas.gestacoes.filter(g => g.dataPrevisaoParto && g.dataPrevisaoParto <= limiteParto.toISOString().slice(0, 10));
    return <section className="atencao-dashboard" aria-labelledby="titulo-atencao">
        <div className="cabecalho-secao-dashboard"><div><h2 id="titulo-atencao">Atenção hoje</h2><p>{dataCivil(hoje.data)}</p></div><a href="#/atividades">Ver atividades →</a></div>
        <div className="grade-atencao">
            <article className={`cartao-atencao${agenda.pendentes.total ? " atencao-atraso" : ""}`}><div className="resumo-atencao"><h3>Atividades atrasadas</h3><strong>{numero(agenda.pendentes.total)}</strong></div>
                {agenda.pendentes.total ? <ul>{agenda.pendentes.atividades.slice(0, 3).map(a => <li key={a.codAtividade}><a className="link-atividade-atrasada" href={`#/atividades/${a.codAtividade}`}>{a.titulo} <span aria-hidden="true">→</span></a><small>{dataHora(a.dataHoraPrevista)}</small></li>)}</ul> : <p>Nenhuma atividade atrasada.</p>}
            </article>
            <article className={`cartao-atencao${hoje.total ? " atencao-aviso" : ""}`}><div className="resumo-atencao"><h3>Agendadas para hoje</h3><strong>{numero(hoje.total)}</strong></div>
                {hoje.total ? <ul>{hoje.atividades.slice(0, 3).map(a => <li key={a.codAtividade}><a href={`#/atividades/${a.codAtividade}`}>{a.titulo}</a><small>{rotulo(a.tipo)} · {dataHora(a.dataHoraPrevista)}</small></li>)}</ul> : <p>Nenhuma atividade agendada para hoje.</p>}
                {hoje.total > 3 && <p>Mostrando 3 de {numero(hoje.total)} atividades de hoje.</p>}
            </article>
            <article className={`cartao-atencao${partos.length ? " atencao-aviso" : ""}`}><div className="resumo-atencao"><h3>Partos próximos</h3></div>
                {partos.length ? <ul>{partos.slice(0, 3).map(g => <li key={g.codGestacao}><a href={`#/reproducao/gestacoes/${g.codGestacao}`}><IdentificacaoAnimal animal={g.animal} /></a><small>{g.dataPrevisaoParto < hoje.data ? "Previsão vencida" : "Parto previsto"}: {dataCivil(g.dataPrevisaoParto)}</small></li>)}</ul> : <p>Nenhum parto previsto nos próximos 30 dias nas gestações consultadas.</p>}
                <a className="link-previsoes" href="#/reproducao/gestacoes">Consultar gestações →</a>
                {previsoesReprodutivas.gestacoes.length >= previsoesReprodutivas.limite && <p>Previsões limitadas às primeiras {previsoesReprodutivas.limite} gestações.</p>}
            </article>
        </div>
    </section>;
}

// Organizar os indicadores e os gráficos da propriedade
export function ConteudoDashboard({ dados, gestor }) {
    const { rebanho, producao, agenda, carencias, referencia } = dados;
    return <>
        <section className="indicadores" aria-label="Resumo da propriedade">
            <Indicador titulo="Animais ativos" valor={numero(rebanho.totalAtivos)} detalhe={`${numero(rebanho.totalInativos)} inativos no histórico`} />
            <Indicador titulo="Em lactação" valor={numero(rebanho.emLactacao)} detalhe={`${numero(rebanho.prenhas)} animais com prenhez registrada`} />
            <Indicador titulo="Leite coletado no período" valor={`${numero(producao.totalLitros)} L`} detalhe={`${meses[referencia.mes - 1]}/${referencia.ano} · ${numero(producao.quantidadeColetas)} coletas registradas`} />
            <Indicador titulo="Animais em carência" valor={numero(carencias.quantidadeAnimais)} detalhe="Carência de leite vigente agora" alerta={carencias.quantidadeAnimais > 0} />
        </section>

        <AtencaoHoje dados={dados} />

        <div className="cabecalho-secao-dashboard"><div><h2>Panorama da propriedade</h2><p>Acompanhe a produção de leite e os resultados da propriedade.</p></div></div>
        <div className={`producao-financeiro-dashboard${gestor && dados.financeiro ? " com-financeiro" : ""}`}>
            <GraficoLinha titulo="Evolução da produção de leite" descricao={`Volume mensal coletado em ${referencia.ano}`}
                exibirTabela={false} acao={<a href="#/leite">Ver coleta de leite →</a>}
                dados={dados.producaoPorMes.map(d => ({ nome: meses[d.mes - 1], valor: d.volumeLitros }))} />
        {gestor && dados.financeiro && <section className="painel financeiro-visao" aria-labelledby="titulo-financeiro-dashboard">
            <div className="titulo-painel"><div><h2 id="titulo-financeiro-dashboard">Financeiro</h2><p>{meses[referencia.mes - 1]}/{referencia.ano}</p></div><a href="#/financeiro">Ver financeiro →</a></div>
            <div className="resumo-financeiro-dashboard">
                <div><span>Receitas</span><strong className="valor-positivo">{moeda(dados.financeiro.totalReceitas)}</strong></div>
                <div><span>Despesas</span><strong className="valor-negativo">{moeda(dados.financeiro.totalCustos)}</strong></div>
                <div className={`saldo-financeiro${Number(dados.financeiro.saldo) < 0 ? " saldo-negativo" : ""}`}><span>Saldo do mês</span><strong className={Number(dados.financeiro.saldo) < 0 ? "valor-negativo" : Number(dados.financeiro.saldo) > 0 ? "valor-positivo" : undefined}>{moeda(dados.financeiro.saldo)}</strong></div>
            </div>
        </section>}

        </div>
        <div className="cabecalho-secao-dashboard"><div><h2>Rotina e acompanhamento</h2><p>Consulte a agenda e os cuidados com cada animal.</p></div></div>
        <div className="grade-rotina">
            <section className="painel" aria-labelledby="titulo-agenda">
                <div className="titulo-painel"><div><h2 id="titulo-agenda">Próximas atividades</h2>
                    <p>{dataCivil(referencia.de)} a {dataCivil(referencia.ate)} · {numero(agenda.total)} atividades</p></div></div>
                {agenda.atividades.length ? <ListaAtividades atividades={agenda.atividades} agora={dados.geradoEm} /> : <p className="texto-vazio">Nenhuma atividade agendada para este período.</p>}
                {agenda.total > agenda.atividades.length && <p className="nota-limite">Exibindo as primeiras {agenda.atividades.length} de {agenda.total} atividades. Escolha um período menor para consultar as demais.</p>}
                <details className="atividades-pendentes"><summary>Atividades atrasadas · {numero(agenda.pendentes.total)}</summary>
                    <p className="nota-limite">Agendadas antes da atualização deste painel, independentemente do filtro da agenda.</p>
                    {agenda.pendentes.atividades.length ? <ListaAtividades atividades={agenda.pendentes.atividades} /> : <p className="texto-vazio">Nenhuma atividade atrasada.</p>}
                    {agenda.pendentes.total > agenda.pendentes.atividades.length && <p className="nota-limite">Exibindo as {agenda.pendentes.atividades.length} mais antigas de {agenda.pendentes.total}.</p>}
                </details>
            </section>

            <section className="painel painel-carencias" aria-labelledby="titulo-carencias">
                <div className="titulo-painel"><div><h2 id="titulo-carencias">Atenção à carência do leite</h2><p>Situação atual, independente do mês selecionado</p></div><a className="link-carencias-dashboard" href="#/carencias">Ver carências <span aria-hidden="true">→</span></a></div>
                {carencias.animais.length ? <ul className="lista-registros">{carencias.animais.map((c, i) => <li key={c.animal?.codAnimal ?? i}>
                    <div><strong>{c.animal ? <a href={`#/animais/${c.animal.codAnimal}`}><IdentificacaoAnimal animal={c.animal} /></a> : <IdentificacaoAnimal />}</strong><span>Carência até {dataHora(c.fimCarenciaLeite)}</span></div>
                </li>)}</ul> : <p className="texto-vazio">Nenhum animal com carência de leite vigente.</p>}
            </section>

            <section className="painel painel-previsoes" aria-labelledby="titulo-previsoes">
                <div className="titulo-painel"><div><h2 id="titulo-previsoes">Previsões reprodutivas</h2><p>Até {dados.previsoesReprodutivas.limite} gestações em andamento de animais ativos</p></div></div>
                {dados.previsoesReprodutivas.gestacoes.length ? <ul className="lista-registros">{dados.previsoesReprodutivas.gestacoes.map(g => <li key={g.codGestacao}>
                    <div><strong>{g.animal ? <a href={`#/animais/${g.animal.codAnimal}`}><IdentificacaoAnimal animal={g.animal} /></a> : <IdentificacaoAnimal />}</strong><span>Parto previsto: {dataCivil(g.dataPrevisaoParto)}</span><small>Secagem prevista: {dataCivil(g.dataPrevistaSecagem)}</small><a className="link-gestacao-dashboard" href={`#/reproducao/gestacoes/${g.codGestacao}`}>Ver gestação <span aria-hidden="true">→</span></a></div>
                </li>)}</ul> : <p className="texto-vazio">Nenhuma gestação em andamento registrada.</p>}
            </section>
        </div>
    </>;
}

// Carregar os dados do painel inicial
function Dashboard({ usuario }) {
    const [consulta, setConsulta] = useState(filtrosIniciais);
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let controller;
        setCarregando(true);
        setErro("");
        setDados(null);

        // Buscar os dados atuais sem apagar o painel durante a atualização
        async function atualizar() {
            if (document.visibilityState === "hidden") return;
            controller?.abort();
            controller = new AbortController();
            const { signal } = controller;
            try {
                const resposta = await dashboardService.consultar(consulta, signal);
                if (!signal.aborted) { setDados(resposta); setErro(""); }
            } catch (falha) {
                if (!signal.aborted) setErro(obterMensagemErro(falha));
            } finally {
                if (!signal.aborted) setCarregando(false);
            }
        }

        atualizar();
        const intervalo = setInterval(atualizar, 30000);
        window.addEventListener("focus", atualizar);
        document.addEventListener("visibilitychange", atualizar);
        return () => {
            controller?.abort();
            clearInterval(intervalo);
            window.removeEventListener("focus", atualizar);
            document.removeEventListener("visibilitychange", atualizar);
        };
    }, [consulta]);

    return <main className="conteudo-dashboard dashboard-milkhub" id="conteudo-dashboard">
            <div className="abertura-dashboard"><div><span className="legenda-login">PAINEL DA PROPRIEDADE</span>
                <h1>Visão geral</h1><p>Acompanhe o rebanho e organize o cuidado de cada dia.</p></div>
                {dados && <p className="atualizacao">{dataCivil(dados.hoje.data)}<br />Atualizado em {dataHora(dados.geradoEm)}<br />Horário de Brasília</p>}
            </div>

            {carregando && <div className="painel estado-dashboard" role="status">Carregando os dados da propriedade…</div>}
            {erro && <div className="painel estado-dashboard"><p className="mensagem-erro" role="alert">{erro}{dados && " Os dados da última consulta foram mantidos."}</p>
                <button className="botao-secundario" onClick={() => setConsulta({ ...consulta })}>Tentar novamente</button></div>}
            {!carregando && dados && <ConteudoDashboard dados={dados} gestor={usuario.perfil === "GESTOR"} />}
        </main>;
}

export default Dashboard;
