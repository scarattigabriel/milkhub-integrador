import "../styles/atividades.css";
import { useCallback, useState } from "react";
import service from "../services/atividade.service.js";
import animalService from "../services/animal.service.js";
import medicamentoService from "../services/medicamento.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import BuscaAnimaisParticipantes from "../components/BuscaAnimaisParticipantes.jsx";
import NovoMedicamento from "../components/NovoMedicamento.jsx";
import Medicamentos from "./Medicamentos.jsx";
import CamposUso, { usoVazio } from "../components/CamposUso.jsx";
import { formularioDaAtividade, prepararAtividade, tiposAtividade } from "../utils/atividade.js";

// Mostrar os campos do agendamento e seus participantes
export function FormularioAtividade({ atividade, animais, medicamentos }) {
    const [formulario, setFormulario] = useState(() => formularioDaAtividade(atividade));
    const [medicamentosDisponiveis, setMedicamentosDisponiveis] = useState(medicamentos);
    const [gerenciandoMedicamentos, setGerenciandoMedicamentos] = useState(false);
    const [cadastroMedicamento, setCadastroMedicamento] = useState(null);
    const gravacao = useGravacao();
    // Atualizar o campo preenchido no formulário
    const alterar = e => setFormulario(f => ({ ...f, [e.target.name]: e.target.value }));
    // Adicionar ou remover um animal dos participantes
    function participante(codigo, marcado) {
        if (!marcado && (atividade?.usosMedicamento?.some(u => u.codAnimal === Number(codigo)) || formulario.usosMedicamento.some(u => String(u.codAnimal) === codigo))) {
            gravacao.setErro("Remova os usos planejados desse animal antes de retirá-lo da atividade."); return;
        }
        gravacao.setErro("");
        setFormulario(f => ({ ...f, animais: marcado ? [...new Set([...f.animais, codigo])] : f.animais.filter(v => v !== codigo) }));
    }
    // Conferir os campos e enviar o cadastro
    function salvar(e) {
        e.preventDefault(); let dados;
        try { dados = prepararAtividade(formulario, !atividade); }
        catch (falha) { gravacao.setErro(falha.message); return; }
        gravacao.executar(() => atividade ? service.atualizar(atividade.codAtividade, dados) : service.criar(dados), a => navegar(`/atividades/${a.codAtividade}`));
    }
    if (atividade && atividade.situacao !== "AGENDADA") return <p className="painel">Somente atividades agendadas podem ser editadas. <a href={`#/atividades/${atividade.codAtividade}`}>Ver atividade</a></p>;
    const participantes = animais.filter(a => formulario.animais.includes(String(a.codAnimal)));
    return <><form className="painel formulario-modulo" onSubmit={salvar} aria-busy={gravacao.salvando}>
        {gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
        <fieldset disabled={gravacao.salvando}><legend>Agendamento</legend><div className="grade-formulario">
            <Campo titulo="Título *"><input name="titulo" maxLength={150} required value={formulario.titulo} onChange={alterar} /></Campo>
            <Campo titulo="Tipo *"><select name="tipo" value={formulario.tipo} onChange={alterar}>{tiposAtividade.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></Campo>
            <Campo titulo="Data e horário previstos (Brasília) *"><input name="dataHoraPrevista" type="datetime-local" step="60" required value={formulario.dataHoraPrevista} onChange={alterar} /></Campo>
            <Campo titulo="Descrição"><textarea name="descricao" rows={3} value={formulario.descricao} onChange={alterar} /></Campo>
        </div></fieldset>
        <fieldset disabled={gravacao.salvando}><legend>Animais participantes</legend><p className="nota-limite">Trabalhos gerais podem ser agendados sem animais. Selecione os participantes antes de incluir medicamentos.</p>
            <BuscaAnimaisParticipantes animais={animais} selecionados={formulario.animais} onSelecionar={codigo => participante(codigo, true)} onRemover={codigo => participante(codigo, false)} />
        </fieldset>
        {!atividade ? <fieldset disabled={gravacao.salvando}><legend>Medicamentos planejados</legend>
            <p className="nota-limite">A carência só começará após confirmar a aplicação na conclusão. Dose e carência podem ser confirmadas ou ajustadas nessa etapa.</p>
            {formulario.usosMedicamento.map((uso, i) => <section className="uso-planejado" key={i} aria-label={`Uso planejado ${i + 1}`}>
                <CamposUso dados={uso} animais={participantes} medicamentos={medicamentosDisponiveis} onCadastrarMedicamento={() => setCadastroMedicamento(i)} onAlterar={novo => setFormulario(f => ({ ...f, usosMedicamento: f.usosMedicamento.map((u, j) => j === i ? novo : u) }))} />
                <button type="button" className="botao-texto" onClick={() => setFormulario(f => ({ ...f, usosMedicamento: f.usosMedicamento.filter((_, j) => j !== i) }))}>Remover este uso</button>
            </section>)}
            <button type="button" className="botao-secundario" disabled={!participantes.length} onClick={() => setFormulario(f => ({ ...f, usosMedicamento: [...f.usosMedicamento, { ...usoVazio(), codAnimal: participantes.length === 1 ? String(participantes[0].codAnimal) : "" }] }))}>Adicionar medicamento</button>
            {!participantes.length && <p className="nota-limite">Busque e selecione um animal para adicionar um medicamento planejado.</p>}
            <button type="button" className="botao-texto cadastrar-medicamento" onClick={() => setCadastroMedicamento(-1)}>Cadastrar novo medicamento</button>
            <button type="button" className="botao-secundario gerenciar-medicamentos-botao" onClick={() => setGerenciandoMedicamentos(true)}>Gerenciar medicamentos</button>
        </fieldset> : <p className="nota-limite">Os medicamentos planejados são alterados nos detalhes da atividade. Os usos existentes serão preservados ao salvar este formulário.</p>}
        <div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : "Salvar agendamento"}</button>
            {!gravacao.salvando && <a className="botao-secundario" href={atividade ? `#/atividades/${atividade.codAtividade}` : "#/atividades"}>Cancelar</a>}</div>
    </form>{gerenciandoMedicamentos && <Medicamentos gestor emJanela onFechar={() => setGerenciandoMedicamentos(false)} onAlterado={({ tipo, medicamento }) => {
        setMedicamentosDisponiveis(atuais => {
            const restantes = atuais.filter(m => m.codMedicamento !== medicamento.codMedicamento);
            return tipo === "excluir" ? restantes : [...restantes, medicamento];
        });
        if (tipo === "excluir") setFormulario(f => ({ ...f, usosMedicamento: f.usosMedicamento.map(u => String(u.codMedicamento) === String(medicamento.codMedicamento) ? { ...u, codMedicamento: "" } : u) }));
    }} />}{cadastroMedicamento !== null && <NovoMedicamento onFechar={() => setCadastroMedicamento(null)} onCriado={novo => {
        setMedicamentosDisponiveis(m => [...m, novo]);
        setFormulario(f => ({ ...f, usosMedicamento: f.usosMedicamento.map((u, i) => i === cadastroMedicamento ? { ...u, codMedicamento: String(novo.codMedicamento) } : u) }));
        setCadastroMedicamento(null);
    }} />}</>;
}

// Carregar os dados para agendar ou editar a atividade
export default function AtividadeFormulario({ codigo }) {
    const consulta = useConsulta(useCallback(async signal => {
        const [atividade, animais, medicamentos] = await Promise.all([codigo ? service.buscar(codigo, signal) : Promise.resolve(null),
            animalService.listar({}, signal), medicamentoService.listar("", signal)]);
        const ids = atividade?.participacoes.map(p => p.codAnimal) || [];
        return { atividade, animais: animais.filter(a => a.situacaoRebanho === "ATIVA" || ids.includes(a.codAnimal)), medicamentos };
    }, [codigo]));
    return <main className="conteudo-dashboard pagina-atividades"><CabecalhoModulo titulo={codigo ? "Editar agendamento" : "Agendar atividade"} descricao="Planeje as tarefas, os exames e os tratamentos da propriedade." />
        <EstadoConsulta consulta={consulta} />{consulta.dados && <FormularioAtividade {...consulta.dados} />}
    </main>;
}
