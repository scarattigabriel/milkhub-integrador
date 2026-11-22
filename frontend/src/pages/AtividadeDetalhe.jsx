import "../styles/atividades.css";
import { useCallback, useState } from "react";
import service from "../services/atividade.service.js";
import medicamentoService from "../services/medicamento.service.js";
import usoService from "../services/usoMedicamento.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import useAgora from "../hooks/useAgora.js";
import { CabecalhoModulo, EstadoConsulta } from "../components/Modulo.jsx";
import NovoMedicamento from "../components/NovoMedicamento.jsx";
import CamposUso, { usoVazio } from "../components/CamposUso.jsx";
import { prepararUso, nomeTipo, situacaoDaAtividade } from "../utils/atividade.js";
import { dataHora, identificarAnimal, rotulo } from "../utils/formatacao.js";

// Mostrar as aplicações e permitir ajustar os usos planejados
export function UsosDaAtividade({ atividade, medicamentos, gestor, recarregar }) {
    const [edicao, setEdicao] = useState(null);
    const [formulario, setFormulario] = useState(null);
    const [exclusao, setExclusao] = useState(null);
    const gravacao = useGravacao();
    const [novosMedicamentos, setNovosMedicamentos] = useState([]);
    const [criandoMedicamento, setCriandoMedicamento] = useState(false);
    const medicamentosDisponiveis = [...medicamentos, ...novosMedicamentos.filter(n => !medicamentos.some(m => m.codMedicamento === n.codMedicamento))];
    const animais = atividade.participacoes.map(p => p.animal);
    const podeAlterar = gestor && atividade.situacao === "AGENDADA";
    // Conferir os campos e enviar o cadastro
    function salvar(e) {
        e.preventDefault(); let dados;
        try { dados = prepararUso(formulario); } catch (falha) { gravacao.setErro(falha.message); return; }
        gravacao.executar(() => {
            if (!edicao) return usoService.criar(atividade.codAtividade, dados);
            const { codAnimal, ...alteracoes } = dados;
            return usoService.atualizar(edicao, alteracoes);
        }, recarregar);
    }
    return <><section className="painel espaco-acima"><h2 className="titulo-secao">Medicamentos e aplicações</h2>
        {gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
        {atividade.usosMedicamento.length ? <ul className="lista-registros">{atividade.usosMedicamento.map(u => <li key={u.codUso}>
            <strong>{u.medicamento?.nome || "Medicamento"}</strong><span>{identificarAnimal(animais.find(a => a.codAnimal === u.codAnimal))}</span>
            <span>Dose: {u.dose || "Não informada"} · Carência: {u.valorCarencia == null ? "Não informada" : `${u.valorCarencia} ${rotulo(u.unidadeCarencia)}`}</span>
            <span>{u.dataHoraAplicacao ? `Aplicado em ${dataHora(u.dataHoraAplicacao)} · Fim da carência: ${dataHora(u.fimCarenciaLeite)}` : atividade.situacao === "CANCELADA" ? "Cancelado, sem aplicação e sem carência" : "Planejado, sem aplicação e sem carência vigente"}</span>
            {u.observacao && <small>{u.observacao}</small>}
            {podeAlterar && <div className="acoes-modulo"><button className="botao-texto" disabled={gravacao.salvando} onClick={() => { setEdicao(u.codUso); setExclusao(null); setFormulario({ ...u, codAnimal: String(u.codAnimal), codMedicamento: String(u.codMedicamento) }); }}>Editar uso</button>
                <button className="botao-texto" disabled={gravacao.salvando} onClick={() => { setExclusao(u); setFormulario(null); }}>Remover uso</button></div>}
        </li>)}</ul> : <p className="texto-vazio">Nenhum medicamento vinculado.</p>}
        {exclusao && <div className="confirmar-exclusao"><p>Remover o uso planejado de {exclusao.medicamento?.nome}?</p><div className="acoes-modulo">
            <button className="botao-perigo" disabled={gravacao.salvando} onClick={() => gravacao.executar(() => usoService.excluir(exclusao.codUso), recarregar)}>Confirmar remoção</button>
            <button className="botao-secundario" disabled={gravacao.salvando} onClick={() => setExclusao(null)}>Cancelar</button>
        </div></div>}
        {podeAlterar && !formulario && <button className="botao-secundario espaco-acima" disabled={!animais.length || gravacao.salvando} onClick={() => { setEdicao(null); setExclusao(null); setFormulario(usoVazio()); }}>Adicionar uso planejado</button>}
        {podeAlterar && !formulario && <button type="button" className="botao-texto cadastrar-medicamento" disabled={gravacao.salvando} onClick={() => setCriandoMedicamento(true)}>Cadastrar novo medicamento</button>}
        {podeAlterar && !animais.length && <p className="nota-limite">Edite o agendamento e selecione animais antes de adicionar medicamentos.</p>}
        {podeAlterar && formulario && <form className="formulario-modulo espaco-acima" onSubmit={salvar}>
            <fieldset disabled={gravacao.salvando}><legend>{edicao ? "Editar uso planejado" : "Novo uso planejado"}</legend>
                <CamposUso dados={formulario} onAlterar={setFormulario} animais={animais} medicamentos={medicamentosDisponiveis} onCadastrarMedicamento={() => setCriandoMedicamento(true)} fixarAnimal={Boolean(edicao)} />
            </fieldset><div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>Salvar uso planejado</button>
                <button type="button" className="botao-secundario" disabled={gravacao.salvando} onClick={() => setFormulario(null)}>Cancelar</button></div>
        </form>}
    </section>{criandoMedicamento && <NovoMedicamento onFechar={() => setCriandoMedicamento(false)} onCriado={novo => {
        setNovosMedicamentos(m => [...m, novo]);
        setFormulario(f => f ? { ...f, codMedicamento: String(novo.codMedicamento) } : f);
        setCriandoMedicamento(false);
    }} />}</>;
}

// Carregar os participantes e as aplicações da atividade
export default function AtividadeDetalhe({ codigo, gestor }) {
    const agora = useAgora();
    const [cancelando, setCancelando] = useState(false);
    const gravacao = useGravacao();
    const consulta = useConsulta(useCallback(async signal => {
        const [atividade, medicamentos] = await Promise.all([service.buscar(codigo, signal), medicamentoService.listar("", signal)]);
        return { atividade, medicamentos };
    }, [codigo]));
    const a = consulta.dados?.atividade;
    return <main className="conteudo-dashboard pagina-atividades"><CabecalhoModulo titulo={a?.titulo || "Atividade"} descricao="Consulte o planejamento, os participantes e os tratamentos.">
        <a className="botao-secundario" href="#/atividades">Voltar à agenda</a>
        {gestor && a?.situacao === "AGENDADA" && <><a className="botao-secundario" href={`#/atividades/${codigo}/editar`}>Editar agendamento</a>
            <a className="botao-primario" href={`#/atividades/${codigo}/concluir`}>Concluir atividade</a></>}
        {a?.situacao === "CONCLUIDA" && <a className="botao-secundario" href="#/carencias">Consultar carências</a>}
    </CabecalhoModulo><EstadoConsulta consulta={consulta} />
        {gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
        {a && <><section className="painel"><dl className="grade-detalhes">
            {[["Tipo", nomeTipo(a.tipo)], ["Situação", <span className={situacaoDaAtividade(a, agora) === "ATRASADA" ? "atividade-atrasada" : a.situacao === "CONCLUIDA" ? "atividade-concluida" : undefined}>{rotulo(situacaoDaAtividade(a, agora))}</span>], ["Agendamento (Brasília)", dataHora(a.dataHoraPrevista)], ["Encerramento (Brasília)", dataHora(a.dataHoraEncerramento)]].map(([titulo, valor]) => <div key={titulo}><dt>{titulo}</dt><dd>{valor}</dd></div>)}
        </dl>{a.descricao && <p className="texto-longo">{a.descricao}</p>}
            <h2 className="titulo-secao">Animais participantes</h2>{a.participacoes.length ? <ul>{a.participacoes.map(p => <li key={p.codAnimal}><a href={`#/animais/${p.codAnimal}`}>{identificarAnimal(p.animal)}</a></li>)}</ul> : <p className="texto-vazio">Atividade geral da propriedade, sem animais.</p>}
        </section>
            <UsosDaAtividade atividade={a} medicamentos={consulta.dados.medicamentos} gestor={gestor} recarregar={consulta.recarregar} />
            {gestor && a.situacao === "AGENDADA" && <section className="painel espaco-acima">
                {!cancelando ? <button className="botao-secundario" onClick={() => setCancelando(true)}>Cancelar atividade</button> : <>
                    <p>Confirmar o cancelamento? Os usos planejados serão mantidos no histórico, sem aplicação ou carência.</p><div className="acoes-modulo">
                        <button className="botao-perigo" disabled={gravacao.salvando} onClick={() => gravacao.executar(() => service.cancelar(codigo), () => { setCancelando(false); consulta.recarregar(); })}>Confirmar cancelamento</button>
                        <button className="botao-secundario" disabled={gravacao.salvando} onClick={() => setCancelando(false)}>Voltar</button>
                    </div></>}
            </section>}
        </>}
    </main>;
}
