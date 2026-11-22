import "../styles/carencias.css";
import { useCallback, useState } from "react";
import service from "../services/usoMedicamento.service.js";
import animalService from "../services/animal.service.js";
import useConsulta from "../hooks/useConsulta.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { dataHora, identificarAnimal } from "../utils/formatacao.js";

// Mostrar os animais com carência de leite em andamento
export default function Carencias({ codigo }) {
    const [animal, setAnimal] = useState(codigo || "");
    const [filtro, setFiltro] = useState(codigo || "");
    const consulta = useConsulta(useCallback(async signal => {
        const [carencias, animais] = await Promise.all([service.carencias(filtro, signal), animalService.listar({ situacaoRebanho: "ATIVA" }, signal)]);
        return { carencias, animais, consultadoEm: new Date() };
    }, [filtro]));
    return <main className="conteudo-dashboard pagina-carencias"><CabecalhoModulo titulo="Carências do leite" descricao="Animais ativos com aplicações concluídas e carência vigente no momento da consulta."><a className="botao-secundario" href="#/atividades">Voltar às atividades</a></CabecalhoModulo>
        <form className="painel filtros-modulo" onSubmit={e => { e.preventDefault(); if (animal === filtro) consulta.recarregar(); else setFiltro(animal); }}>
            <Campo titulo="Animal"><select value={animal} onChange={e => setAnimal(e.target.value)}><option value="">Todos os ativos</option>
                {animal && !consulta.dados?.animais.some(a => String(a.codAnimal) === animal) && <option value={animal}>Animal selecionado</option>}
                {consulta.dados?.animais.map(a => <option key={a.codAnimal} value={a.codAnimal}>{identificarAnimal(a)}</option>)}</select></Campo>
            <button className="botao-primario" disabled={consulta.carregando}>Atualizar carências</button>
        </form><EstadoConsulta consulta={consulta} />
        {consulta.dados && <><p className="nota-limite">Consulta em {dataHora(consulta.dados.consultadoEm)} · Horário de Brasília. Atualize para conferir mudanças ou vencimentos.</p>
            {!consulta.dados.carencias.length ? <p className="painel texto-vazio">Nenhum animal com carência vigente para este filtro.</p> : <div className="grade-carencias">
                {consulta.dados.carencias.map(c => <article className="painel painel-carencias" key={c.animal.codAnimal}>
                    <h2 className="titulo-secao identificacao-carencia"><a href={`#/animais/${c.animal.codAnimal}`}>
                        <span>{c.animal.nome || "Animal"}</span>
                        <small>Brinco {c.animal.brinco ?? "não informado"}</small>
                    </a></h2>
                    <p className="mensagem-aviso prazo-carencia">Carência do leite até {dataHora(c.fimCarenciaLeite)}</p>
                    <ul className="lista-registros">{c.usosMedicamento.map(u => <li key={u.codUso}><strong>{u.medicamento?.nome || "Medicamento"}</strong>
                        <span>Aplicação: {dataHora(u.dataHoraAplicacao)} · Dose: {u.dose}</span><span>Carência: {u.valorCarencia} {u.unidadeCarencia === "DIAS" ? "dias" : "horas"} · Até {dataHora(u.fimCarenciaLeite)}</span>
                        <a href={`#/atividades/${u.codAtividade}`}>Ver atividade</a>
                    </li>)}</ul>
                </article>)}
            </div>}
        </>}
    </main>;
}
