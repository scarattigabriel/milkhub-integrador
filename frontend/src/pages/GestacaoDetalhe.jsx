import IdentificacaoAnimal from "../components/IdentificacaoAnimal.jsx";
import "../styles/reproducao.css";
import { useCallback } from "react";
import service from "../services/reproducao.service.js";
import useConsulta from "../hooks/useConsulta.js";
import { CabecalhoModulo, EstadoConsulta } from "../components/Modulo.jsx";
import { dataCivil, rotulo } from "../utils/formatacao.js";
// Mostrar a gestação e seus eventos registrados
export default function GestacaoDetalhe({ codigo, gestor }) {
    const consulta = useConsulta(useCallback(signal => service.buscar("gestacoes", codigo, signal), [codigo]));
    const g = consulta.dados;
    const acoes = gestor && g?.situacao === "EM_ANDAMENTO" ? <div className="painel acoes-modulo espaco-acima">
        {!g.secagem && g.animal.situacaoLactacao === "EM_LACTACAO" && <a className="botao-secundario" href={`#/reproducao/secagens/nova/${codigo}`}>Registrar secagem</a>}
        <a className="botao-primario" href={`#/reproducao/partos/nova/${codigo}`}>Registrar parto</a>
        <a className="botao-secundario" href={`#/reproducao/gestacoes/${codigo}/perda`}>Registrar perda gestacional</a>
    </div> : null;
    return <main className="conteudo-dashboard pagina-reproducao"><CabecalhoModulo titulo="Gestação" descricao="Previsões e histórico do ciclo reprodutivo."><a className="botao-secundario" href="#/reproducao/gestacoes">Voltar às gestações</a>{gestor && g?.situacao === "EM_ANDAMENTO" && <a className="botao-primario" href={`#/reproducao/gestacoes/${codigo}/editar`}>Ajustar previsões</a>}</CabecalhoModulo><EstadoConsulta consulta={consulta} />{g && <section className="painel"><dl className="grade-detalhes">{[["Animal", <a href={`#/animais/${g.codAnimal}`}><IdentificacaoAnimal animal={g.animal} /></a>], ["Situação", rotulo(g.situacao)], ["Inseminação", g.inseminacao ? <a className="botao-secundario" href={`#/reproducao/inseminacoes/${g.codInseminacao}`}>{dataCivil(g.inseminacao.dataInseminacao)}</a> : "Não conhecida"], ["Parto previsto", dataCivil(g.dataPrevisaoParto)], ["Secagem prevista", dataCivil(g.dataPrevistaSecagem)], ["Encerramento", dataCivil(g.dataEncerramento)], ["Secagem realizada", dataCivil(g.secagem?.dataSecagem)], ["Parto realizado", dataCivil(g.parto?.dataParto)]].map(([titulo, valor]) => <div key={titulo}><dt>{titulo}</dt><dd>{valor}</dd></div>)}</dl>{g.observacao && <p className="texto-longo">{g.observacao}</p>}<h2 className="titulo-secao">Diagnósticos do ciclo</h2>{g.diagnosticos.length ? <ul className="lista-registros">{g.diagnosticos.map(d => <li key={d.codDiagnostico}><strong>{rotulo(d.resultado)}</strong><span>{dataCivil(d.dataDiagnostico)}</span><span>{d.metodo}</span>{d.observacao && <small>{d.observacao}</small>}</li>)}</ul> : <p>Nenhum diagnóstico vinculado.</p>}</section>}{acoes}</main>;
}
