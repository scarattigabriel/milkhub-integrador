import { useId, useState } from "react";
import { numero } from "../utils/formatacao.js";

const cores = ["#70452f", "#ad7954", "#82705e", "#c19a65", "#596853", "#a65149"];

// Mostrar os valores do gráfico em uma tabela
function TabelaDados({ dados, formatar }) {
    return <details className="dados-grafico"><summary>Ver dados em tabela</summary>
        <table><thead><tr><th scope="col">Referência</th><th scope="col">Valor</th></tr></thead>
            <tbody>{dados.map((d, i) => <tr key={i}><th scope="row">{d.nome}</th><td>{formatar(d.valor)}</td></tr>)}</tbody>
        </table>
    </details>;
}

// Desenhar a produção mensal e mostrar o volume ao selecionar um ponto
export function GraficoLinha({ titulo, descricao, dados, unidade = "L", eixoHorizontal = "Mês", exibirTabela = true, acao, mensagemVazia = "Nenhum volume de leite registrado neste ano." }) {
    const id = useId();
    const [pontoAtivo, setPontoAtivo] = useState(null);
    const maximo = Math.max(1, ...dados.map(d => Number(d.valor)));
    // Calcular a posição horizontal do ponto
    const x = i => 60 + (i * 620) / Math.max(1, dados.length - 1);
    // Calcular a altura do valor no gráfico
    const y = valor => 190 - Number(valor) / maximo * 160;
    const pontos = dados.map((d, i) => `${x(i)},${y(d.valor)}`).join(" ");
    return <section className="painel grafico grafico-producao" aria-labelledby={id}>
        <div className="titulo-painel"><div><h2 id={id}>{titulo}</h2><p>{descricao}</p></div>{acao}</div>
        <div className="rolagem-grafico" tabIndex="0" role="region" aria-label="Gráfico mensal com rolagem horizontal em telas pequenas">
        <svg className="linha-svg" viewBox="0 0 710 260" role="group" aria-labelledby={`${id}-svg`}>
            <desc id={`${id}-svg`}>{`${titulo}. Valores em ${unidade}; selecione um ponto para consultar o valor${exibirTabela ? " ou use a tabela abaixo" : ""}.`}</desc>
            <text x="370" y="250" textAnchor="middle">{eixoHorizontal}</text>
            {[0, .5, 1].map(fracao => <g key={fracao}>
                <line x1="60" x2="680" y1={y(maximo * fracao)} y2={y(maximo * fracao)} stroke="#e3e9e2" />
                <text x="50" y={y(maximo * fracao) + 4} textAnchor="end">{fracao === .5 ? (unidade === "L" ? "Litros" : unidade) : numero(maximo * fracao)}</text>
            </g>)}
            {dados.length > 0 && <><polygon points={`60,190 ${pontos} 680,190`} fill="#f4ecdf" />
                <polyline points={pontos} fill="none" stroke="#70452f" strokeWidth="3" strokeLinejoin="round" /></>}
            {dados.map((d, i) => <g key={i} onMouseEnter={() => setPontoAtivo(i)} onMouseLeave={() => setPontoAtivo(null)}>
                <circle className="alvo-ponto-grafico" cx={x(i)} cy={y(d.valor)} r="12" fill="transparent" tabIndex="0" role="button"
                    aria-label={`${d.nome}: ${numero(d.valor)} ${unidade}`} aria-pressed={pontoAtivo === i}
                    onFocus={() => setPontoAtivo(i)} onBlur={() => setPontoAtivo(null)}
                    onClick={() => setPontoAtivo(i)}
                    onKeyDown={evento => {
                        if (evento.key === "Escape") setPontoAtivo(null);
                        if (["Enter", " "].includes(evento.key)) { evento.preventDefault(); setPontoAtivo(atual => atual === i ? null : i); }
                    }} />
                <circle cx={x(i)} cy={y(d.valor)} r={pontoAtivo === i ? 6 : 4} fill="#70452f" pointerEvents="none" />
                <text x={x(i)} y="220" textAnchor="middle">{d.nome}</text>
            </g>)}
            {pontoAtivo !== null && dados[pontoAtivo] && <g className="tooltip-ponto-grafico" role="tooltip" pointerEvents="none"
                transform={`translate(${Math.max(4, Math.min(542, x(pontoAtivo) - 82))}, ${y(dados[pontoAtivo].valor) < 54 ? y(dados[pontoAtivo].valor) + 18 : y(dados[pontoAtivo].valor) - 46})`}>
                <rect width="164" height="34" rx="7" fill="#583823" />
                <text x="82" y="22" textAnchor="middle" style={{ fill: "#fff", fontSize: "12px", fontWeight: 600 }}>{`${numero(dados[pontoAtivo].valor)} ${unidade}`}</text>
            </g>}
        </svg></div>
        {dados.every(d => Number(d.valor) === 0) && <p className="texto-vazio">{mensagemVazia}</p>}
        {exibirTabela && <TabelaDados dados={dados} formatar={v => `${numero(v)} ${unidade}`} />}
    </section>;
}

// Desenhar os volumes diários e permitir consultar cada barra
export function GraficoColunas({ titulo, descricao, dados, mensagemVazia }) {
    const id = useId();
    const [ativo, setAtivo] = useState(null);
    const largura = Math.max(710, 90 + dados.length * 32);
    const inicio = 70, fim = largura - 20, base = 210;
    const passo = (fim - inicio) / Math.max(1, dados.length);
    const maximo = Math.max(1, ...dados.map(d => Number(d.valor)));
    // Calcular a altura do valor no gráfico
    const y = valor => base - Number(valor) / maximo * 170;
    return <section className="painel grafico" aria-labelledby={id}>
        <div className="titulo-painel"><div><h2 id={id}>{titulo}</h2><p>{descricao}</p></div></div>
        <div className="rolagem-grafico" tabIndex="0" role="region" aria-label="Volume diário em litros; role horizontalmente em telas pequenas">
            <svg className="colunas-svg" viewBox={`0 0 ${largura} 285`} style={{ minWidth: largura }} role="group" aria-labelledby={`${id}-descricao`}>
                <desc id={`${id}-descricao`}>Volume coletado por dia, em litros. Selecione uma barra para consultar o volume.</desc>
                {[0, .5, 1].map(fracao => <g key={fracao}>
                    <line x1={inicio} x2={fim} y1={y(maximo * fracao)} y2={y(maximo * fracao)} stroke="#ded3c7" />
                    <text x="60" y={y(maximo * fracao) + 4} textAnchor="end">{fracao === .5 ? "Litros" : numero(maximo * fracao)}</text>
                </g>)}
                {dados.map((d, i) => <g key={i} onMouseEnter={() => setAtivo(i)} onMouseLeave={() => setAtivo(null)}>
                    <rect className="coluna-diaria" x={inicio + i * passo + passo * .2} y={y(d.valor)} width={passo * .6} height={Math.max(2, base - y(d.valor))} rx="3"
                        tabIndex="0" role="button" aria-label={`Dia ${d.nome}: ${numero(d.valor)} L`} aria-pressed={ativo === i}
                        onFocus={() => setAtivo(i)} onBlur={() => setAtivo(null)} onClick={() => setAtivo(i)}
                        onKeyDown={e => { if (e.key === "Escape") setAtivo(null); if (["Enter", " "].includes(e.key)) { e.preventDefault(); setAtivo(i); } }} />
                    <text x={inicio + (i + .5) * passo} y="235" textAnchor="middle">{d.nome}</text>
                </g>)}
                <text x={(inicio + fim) / 2} y="270" textAnchor="middle">Dia</text>
                {ativo !== null && dados[ativo] && <g role="tooltip" pointerEvents="none" transform={`translate(${Math.max(0, Math.min(largura - 164, inicio + (ativo + .5) * passo - 82))}, ${Math.max(0, y(dados[ativo].valor) - 36)})`}>
                    <rect width="164" height="30" rx="6" fill="#583823" />
                    <text x="82" y="20" textAnchor="middle" style={{ fill: "#fff" }}>{numero(dados[ativo].valor)} L</text>
                </g>}
            </svg>
        </div>
        {dados.every(d => Number(d.valor) === 0) && <p className="texto-vazio">{mensagemVazia}</p>}
    </section>;
}

// Comparar os valores usando barras horizontais
export function GraficoBarras({ titulo, descricao, dados, formatar = numero, exibirTabela = true, mensagemVazia = "Nenhum animal ativo cadastrado." }) {
    const id = useId();
    const maximo = Math.max(1, ...dados.map(d => Number(d.valor)));
    return <section className="painel grafico" aria-labelledby={id}>
        <div className="titulo-painel"><div><h2 id={id}>{titulo}</h2><p>{descricao}</p></div></div>
        {dados.length ? <ul className="barras">{dados.map((d, i) => <li key={i}>
            <div className="rotulo-barra"><span>{d.nome}</span><strong>{formatar(d.valor)}</strong></div>
            <div className="trilho-barra" aria-hidden="true"><div style={{ width: `${Number(d.valor) / maximo * 100}%`, background: d.cor || cores[i % cores.length] }} /></div>
        </li>)}</ul> : <p className="texto-vazio">{mensagemVazia}</p>}
        {exibirTabela && <TabelaDados dados={dados} formatar={formatar} />}
    </section>;
}
