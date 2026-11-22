import "../styles/animais.css";
import { useCallback } from "react";
import animalService from "../services/animal.service.js";
import useConsulta from "../hooks/useConsulta.js";
import { CabecalhoModulo, EstadoConsulta, Situacao } from "../components/Modulo.jsx";
import { dataCivil, dataHora, rotulo, identificarAnimal } from "../utils/formatacao.js";

// Mostrar os eventos já registrados para o animal
export function HistoricoAnimal({ dados }) {
    const grupos = [
        ["Atividades", dados.atividades, a => <a href={`#/atividades/${a.codAtividade}`}>{a.titulo}</a>, a => `${rotulo(a.situacao)} · Prevista: ${dataHora(a.dataHoraPrevista)}${a.dataHoraEncerramento ? ` · Encerramento: ${dataHora(a.dataHoraEncerramento)}` : ""}`],
        ["Medicamentos e tratamentos", dados.usosMedicamento, a => a.medicamento?.nome || "Medicamento", a => `${a.dataHoraAplicacao ? `Aplicação: ${dataHora(a.dataHoraAplicacao)}` : "Uso sem aplicação registrada"} · Dose: ${a.dose || "Não informada"} · Fim de carência: ${dataHora(a.fimCarenciaLeite)}`],
        ["Inseminações", dados.inseminacoes, a => <a href={`#/reproducao/inseminacoes/${a.codInseminacao}`}>Inseminação em {dataCivil(a.dataInseminacao)}</a>, a => `${a.tipoSemen || "Sêmen não informado"}${a.lote ? ` · Lote ${a.lote}` : ""}`],
        ["Diagnósticos de gestação", dados.diagnosticos, a => `${rotulo(a.resultado)} · ${dataCivil(a.dataDiagnostico)}`, a => a.metodo],
        ["Gestações", dados.gestacoes, a => <a href={`#/reproducao/gestacoes/${a.codGestacao}`}>{rotulo(a.situacao)}</a>, a => `Parto previsto: ${dataCivil(a.dataPrevisaoParto)} · Secagem prevista: ${dataCivil(a.dataPrevistaSecagem)}${a.dataEncerramento ? ` · Encerrada em ${dataCivil(a.dataEncerramento)}` : ""}`],
        ["Partos", dados.partos, a => `Parto em ${dataCivil(a.dataParto)}`, a => a.observacao || "Sem observações"],
        ["Secagens", dados.secagens, a => `Secagem em ${dataCivil(a.dataSecagem)}`, a => a.observacao || "Sem observações"],
    ];
    return <section className="historico-animal" aria-label="Histórico do animal">{grupos.map(([titulo, registros, principal, detalhe]) =>
        <details className="painel" key={titulo} open={titulo === "Medicamentos e tratamentos"}>
            <summary>{titulo} <span className="selo">{registros.length}</span></summary>
            {registros.length ? <ul className="lista-registros">{registros.map((r, i) => <li key={i}><strong>{principal(r)}</strong><span>{detalhe(r)}</span>{r.observacao && !["Partos", "Secagens"].includes(titulo) && <small>{r.observacao}</small>}</li>)}</ul>
                : <p className="texto-vazio">Nenhum registro encontrado.</p>}
        </details>)}</section>;
}

// Carregar os dados e o histórico do animal
export default function AnimalDetalhe({ codigo, gestor }) {
    const consulta = useConsulta(useCallback(signal => animalService.historico(codigo, signal), [codigo]));
    const a = consulta.dados?.animal;
    return <main className="conteudo-dashboard pagina-animais"><CabecalhoModulo titulo={a?.nome || "Detalhes do animal"} descricao={a ? `Brinco ${a.brinco}` : "Identificação e histórico do rebanho."}>
        <a className="botao-secundario" href="#/animais">Voltar aos animais</a>
        {a?.situacaoRebanho === "ATIVA" && <a className="botao-secundario" href={`#/carencias/${codigo}`}>Carências do leite</a>}
        {gestor && a && <><a className="botao-primario" href={`#/animais/${codigo}/editar`}>Editar animal</a>
            {a.situacaoRebanho === "ATIVA" && <a className="botao-secundario" href={`#/animais/${codigo}/saida`}>Registrar saída</a>}</>}
    </CabecalhoModulo><EstadoConsulta consulta={consulta} />
        {a && <><section className="painel identificacao-animal" aria-label="Identificação">
            <Situacao valor={a.situacaoRebanho} /><dl className="grade-detalhes">
                {[["Sexo", a.sexo === "F" ? "Fêmea" : "Macho"], ["Nascimento", dataCivil(a.dataNascimento)], ["Categoria", rotulo(a.categoria)],
                    ["Raça", a.raca?.nome || "Não informada"], ["Lactação", rotulo(a.situacaoLactacao)], ["Prenhe", a.prenha === "S" ? "Sim" : "Não"],
                    ["Mãe", a.mae ? <a href={`#/animais/${a.mae.codAnimal}`}>{identificarAnimal(a.mae)}</a> : "Não informada"],
                    ["Parto de nascimento", a.partoNascimento ? dataCivil(a.partoNascimento.dataParto) : "Não informado"]].map(([titulo, valor]) => <div key={titulo}><dt>{titulo}</dt><dd>{valor}</dd></div>)}
            </dl>{a.situacaoRebanho === "INATIVA" && <p className="mensagem-aviso">Saída em {dataCivil(a.dataSaida)} · {rotulo(a.tipoSaida)} · {a.motivoSaida}</p>}
        </section><h2 className="titulo-secao">Histórico do animal</h2><HistoricoAnimal dados={consulta.dados} /></>}
    </main>;
}
