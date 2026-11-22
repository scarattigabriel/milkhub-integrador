import SeletorAnimal from "../components/SeletorAnimalReproducao.jsx";
import "../styles/reproducao.css";
import { useCallback, useState } from "react";
import service from "../services/reproducao.service.js";
import animalService from "../services/animal.service.js";
import atividadeService from "../services/atividade.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import Previsoes from "../components/PrevisoesReprodutivas.jsx";
import { prepararDiagnostico } from "../utils/reproducao.js";
import { exibirDataHoraLocal } from "../utils/dataHoraLocal.js";
import { dataCivil, dataHora, filtrosIniciais, rotulo } from "../utils/formatacao.js";

// Mostrar os campos do diagnóstico de gestação
export function FormularioDiagnostico({ animais, inseminacoes, gestacoes, atividades, origem }) {
    const inicial = inseminacoes.find(i => String(i.codInseminacao) === origem);
    const [f, setF] = useState({ codAnimal: inicial ? String(inicial.codAnimal) : "", codInseminacao: inicial ? String(inicial.codInseminacao) : "", codGestacao: "", dataDiagnostico: filtrosIniciais().dataAgenda,
        metodo: "", resultado: "", observacao: "", historico: false, codAtividade: "", dataHoraEncerramento: exibirDataHoraLocal(new Date()),
        previsoesManuais: false, recalcularSecagem: true, dataPrevisaoParto: "", dataPrevistaSecagem: "" });
    const gravacao = useGravacao();
    // Atualizar o campo preenchido no formulário
    function alterar(e) {
        const { name, value, type, checked } = e.target;
        setF(atual => ({ ...atual, [name]: type === "checkbox" ? checked : value,
            ...(name === "codAnimal" ? { codInseminacao: "", codGestacao: "", codAtividade: "" } : {}),
            ...(name === "codGestacao" && value ? { codInseminacao: String(gestacoes.find(g => String(g.codGestacao) === value).codInseminacao || "") } : {}) }));
    }
    // Conferir os campos e enviar o cadastro
    function salvar(e) { e.preventDefault(); let dados; try { dados = prepararDiagnostico(f); } catch (falha) { gravacao.setErro(falha.message); return; }
        gravacao.executar(() => service.registrar("diagnosticos", dados), d => navegar(d.codGestacao ? `/reproducao/gestacoes/${d.codGestacao}` : "/reproducao/diagnosticos")); }
    const exames = atividades.filter(a => a.participacoes.length === 1 && String(a.participacoes[0].codAnimal) === f.codAnimal && !a.usosMedicamento.length);
    return <form className="painel formulario-modulo" onSubmit={salvar}>{gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
        <fieldset disabled={gravacao.salvando}><legend>Diagnóstico realizado</legend><div className="grade-formulario">
            <SeletorAnimal animais={animais} value={f.codAnimal} onChange={alterar} />
            <Campo titulo="Data *"><input name="dataDiagnostico" type="date" required min="0001-01-01" max={filtrosIniciais().dataAgenda} value={f.dataDiagnostico} onChange={alterar} /></Campo>
            <Campo titulo="Resultado *"><select name="resultado" required value={f.resultado} onChange={alterar}><option value="">Selecione</option>{["POSITIVO", "NEGATIVO", "INCONCLUSIVO"].map(v => <option key={v} value={v}>{rotulo(v)}</option>)}</select></Campo>
            <Campo titulo="Método *"><input name="metodo" required maxLength={50} value={f.metodo} onChange={alterar} placeholder="Ex.: ultrassonografia" /></Campo>
            <Campo titulo="Gestação vinculada"><select name="codGestacao" value={f.codGestacao} onChange={alterar}><option value="">Ciclo atual, quando existir</option>{gestacoes.filter(g => String(g.codAnimal) === f.codAnimal && (f.historico || g.situacao === "EM_ANDAMENTO")).map(g => <option key={g.codGestacao} value={g.codGestacao}>{rotulo(g.situacao)} - Parto previsto {dataCivil(g.dataPrevisaoParto)}</option>)}</select></Campo>
            <Campo titulo="Inseminação vinculada"><select name="codInseminacao" value={f.codInseminacao} onChange={alterar} disabled={Boolean(f.codGestacao)}><option value="">Mais recente, quando conhecida</option>{inseminacoes.filter(i => String(i.codAnimal) === f.codAnimal).map(i => <option key={i.codInseminacao} value={i.codInseminacao}>{dataCivil(i.dataInseminacao)} - {i.reprodutor?.nome || "Reprodutor"}</option>)}</select></Campo>
            <Campo titulo="Observação"><textarea name="observacao" value={f.observacao} onChange={alterar} rows={3} /></Campo>
        </div><label className="opcao-marcacao espaco-acima"><input name="historico" type="checkbox" checked={f.historico} onChange={alterar} />Registro histórico, sem alterar o estado atual</label>
        {!f.historico && f.resultado === "POSITIVO" && <Previsoes dados={f} onAlterar={setF} />}
        <h2 className="titulo-secao">Concluir exame agendado (opcional)</h2><p className="nota-limite">Exames deste animal, sem medicamentos.</p>
        <Campo titulo="Exame"><select name="codAtividade" value={f.codAtividade} onChange={alterar}><option value="">Não vincular exame</option>{exames.map(a => <option key={a.codAtividade} value={a.codAtividade}>{a.titulo} - {dataHora(a.dataHoraPrevista)}</option>)}</select></Campo>
        {f.codAtividade && <Campo titulo="Encerramento efetivo do exame (Brasília) *"><input name="dataHoraEncerramento" type="datetime-local" step="1" required value={f.dataHoraEncerramento} max={exibirDataHoraLocal(new Date())} onChange={alterar} /></Campo>}
        </fieldset><div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Registrando…" : "Registrar diagnóstico"}</button>{!gravacao.salvando && <a className="botao-secundario" href="#/reproducao/diagnosticos">Cancelar</a>}</div>
    </form>;
}
// Carregar os dados para registrar o diagnóstico
export default function DiagnosticoFormulario({ origem }) {
    const consulta = useConsulta(useCallback(async signal => { const [animais, inseminacoes, gestacoes, atividades] = await Promise.all([animalService.listar({ sexo: "F" }, signal), service.listar("inseminacoes", {}, signal), service.listar("gestacoes", {}, signal), atividadeService.listar({ tipo: "EXAME", situacao: "AGENDADA" }, signal)]); return { animais, inseminacoes, gestacoes, atividades }; }, []));
    return <main className="conteudo-dashboard pagina-reproducao"><CabecalhoModulo titulo="Registrar diagnóstico" descricao="Confirme a prenhez ou registre um resultado negativo ou inconclusivo." /><EstadoConsulta consulta={consulta} />{consulta.dados && <FormularioDiagnostico {...consulta.dados} origem={origem} />}</main>;
}
