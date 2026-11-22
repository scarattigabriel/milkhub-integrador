import "../styles/atividades.css";
import { useCallback, useState } from "react";
import service from "../services/atividade.service.js";
import animalService from "../services/animal.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useAgora from "../hooks/useAgora.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { dataHora, identificarAnimal, rotulo } from "../utils/formatacao.js";
import { prepararDataHora } from "../utils/dataHoraLocal.js";
import { tiposAtividade, nomeTipo, situacaoDaAtividade } from "../utils/atividade.js";

// Listar a agenda e aplicar os filtros de situação e período
export default function Atividades({ gestor }) {
    const agora = useAgora();
    const [formulario, setFormulario] = useState({ situacao: "AGENDADA", tipo: "", codAnimal: "", de: "", ate: "" });
    const [filtros, setFiltros] = useState({ situacao: "AGENDADA" });
    const [erro, setErro] = useState("");
    const consulta = useConsulta(useCallback(async signal => {
        const [atividades, animais] = await Promise.all([service.listar(filtros, signal), animalService.listar({}, signal)]);
        return { atividades, animais };
    }, [filtros]));
    // Atualizar o campo preenchido no formulário
    const alterar = e => setFormulario(f => ({ ...f, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
    // Aplicar os filtros preenchidos na consulta
    function filtrar(e) {
        e.preventDefault(); setErro("");
        try {
            const valores = Object.fromEntries(["situacao", "tipo", "codAnimal"].filter(c => formulario[c]).map(c => [c, formulario[c]]));
            for (const campo of ["de", "ate"]) if (formulario[campo]) valores[campo] = prepararDataHora(formulario[campo]);
            if (valores.de && valores.ate && valores.de > valores.ate) throw new Error("O início deve anteceder o fim do período.");
            if (formulario.situacao === "ATRASADA") { valores.pendentes = "true"; valores.situacao = "AGENDADA"; }
            setFiltros(valores);
        } catch (falha) { setErro(falha.message); }
    }
    return <main className="conteudo-dashboard pagina-atividades"><CabecalhoModulo titulo="Atividades e tratamentos" descricao="Organize a agenda e acompanhe as aplicações de medicamentos.">
        <a className="botao-secundario" href="#/carencias">Consultar carências</a>{gestor && <a className="botao-primario" href="#/atividades/nova">Agendar atividade</a>}
    </CabecalhoModulo>
        <form className="painel filtros-modulo" onSubmit={filtrar}>
            <Campo titulo="Situação"><select name="situacao" value={formulario.situacao} onChange={alterar}><option value="">Todas</option>{[["AGENDADA", "Agendadas"], ["ATRASADA", "Atrasadas"], ["CONCLUIDA", "Concluídas"], ["CANCELADA", "Canceladas"]].map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></Campo>
            <Campo titulo="Tipo"><select name="tipo" value={formulario.tipo} onChange={alterar}><option value="">Todos</option>{tiposAtividade.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></Campo>
            <Campo titulo="Animal"><select name="codAnimal" value={formulario.codAnimal} onChange={alterar}><option value="">Todos</option>{consulta.dados?.animais.map(a => <option key={a.codAnimal} value={a.codAnimal}>{identificarAnimal(a)}</option>)}</select></Campo>
            <Campo titulo="Agendamento a partir de (Brasília)"><input name="de" type="datetime-local" step="60" value={formulario.de} onChange={alterar} /></Campo>
            <Campo titulo="Agendamento até (Brasília)"><input name="ate" type="datetime-local" step="60" value={formulario.ate} onChange={alterar} /></Campo>
            <button className="botao-primario" disabled={consulta.carregando}>Filtrar</button>
        </form>{erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        <EstadoConsulta consulta={consulta} />{consulta.dados && <section className="painel"><p className="resumo-listagem">{consulta.dados.atividades.length} atividades encontradas</p>
            {consulta.dados.atividades.length ? <div className="tabela-rolagem" role="region" tabIndex="0" aria-label="Tabela com rolagem horizontal"><table className="tabela-modulo"><thead><tr>{["Atividade", "Tipo", "Agendamento (Brasília)", "Situação", "Animais", "Ações"].map(t => <th key={t}>{t}</th>)}</tr></thead><tbody>
                {consulta.dados.atividades.map(a => <tr key={a.codAtividade}><th scope="row">{a.titulo}</th><td>{nomeTipo(a.tipo)}</td><td>{dataHora(a.dataHoraPrevista)}</td><td><span className={situacaoDaAtividade(a, agora) === "ATRASADA" ? "atividade-atrasada" : a.situacao === "CONCLUIDA" ? "atividade-concluida" : undefined}>{rotulo(situacaoDaAtividade(a, agora))}</span></td><td>{a.participacoes.length}</td><td className="acoes-tabela"><a href={`#/atividades/${a.codAtividade}`}>Abrir atividade</a></td></tr>)}
            </tbody></table></div> : <p className="texto-vazio">Nenhuma atividade corresponde aos filtros.</p>}
        </section>}
    </main>;
}
