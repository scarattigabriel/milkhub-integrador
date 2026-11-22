import IdentificacaoAnimal from "../components/IdentificacaoAnimal.jsx";
import "../styles/reproducao.css";
import { useCallback } from "react";
import service from "../services/reproducao.service.js";
import useConsulta from "../hooks/useConsulta.js";
import { CabecalhoModulo, EstadoConsulta } from "../components/Modulo.jsx";
import { dataCivil, rotulo } from "../utils/formatacao.js";
// Mostrar a inseminação e os registros vinculados
export default function InseminacaoDetalhe({ codigo, gestor }) {
    const consulta = useConsulta(useCallback(signal => service.buscar("inseminacoes", codigo, signal), [codigo]));
    const r = consulta.dados;
    return <main className="conteudo-dashboard pagina-reproducao"><CabecalhoModulo titulo="Inseminação" descricao="Informações do registro e diagnósticos vinculados."><a className="botao-secundario" href="#/reproducao">Voltar ao controle reprodutivo</a>{gestor && r && <a className="botao-primario" href={`#/reproducao/diagnosticos/nova/${codigo}`}>Registrar diagnóstico</a>}</CabecalhoModulo><EstadoConsulta consulta={consulta} />{r && <section className="painel"><dl className="grade-detalhes">{[["Animal", <a href={`#/animais/${r.codAnimal}`}><IdentificacaoAnimal animal={r.animal} /></a>], ["Data", dataCivil(r.dataInseminacao)], ["Reprodutor", r.reprodutor?.nome || "Não informado"], ["Confirmação", rotulo(r.confirmacaoPrenhez)], ["Tipo de sêmen", r.tipoSemen || "Não informado"], ["Lote", r.lote || "Não informado"], ["Janela sugerida", `${dataCivil(r.janelaDiagnostico.inicio)} a ${dataCivil(r.janelaDiagnostico.fim)}`]].map(([titulo, valor]) => <div key={titulo}><dt>{titulo}</dt><dd>{valor}</dd></div>)}</dl>{r.observacao && <p className="texto-longo">{r.observacao}</p>}<h2 className="titulo-secao">Diagnósticos vinculados</h2>{r.diagnosticos.length ? <ul className="lista-registros">{r.diagnosticos.map(d => <li key={d.codDiagnostico}><strong>{rotulo(d.resultado)}</strong><span>{dataCivil(d.dataDiagnostico)}</span><span>{d.metodo}</span>{d.codGestacao && <a className="botao-secundario" href={`#/reproducao/gestacoes/${d.codGestacao}`}>Ver gestação</a>}</li>)}</ul> : <p>Nenhum diagnóstico registrado.</p>}</section>}</main>;
}
