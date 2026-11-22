import "../styles/atividades.css";
import { useCallback, useState } from "react";
import service from "../services/atividade.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { exibirDataHoraLocal } from "../utils/dataHoraLocal.js";
import { prepararConclusao } from "../utils/atividade.js";
import { identificarAnimal } from "../utils/formatacao.js";

// Mostrar os dados para confirmar a realização da atividade
export function FormularioConclusao({ atividade }) {
    const [formulario, setFormulario] = useState(() => ({
        dataHoraEncerramento: exibirDataHoraLocal(atividade.dataHoraPrevista),
        usosMedicamento: atividade.usosMedicamento.map(u => ({ codUso: u.codUso, dose: u.dose || "", unidadeCarencia: u.unidadeCarencia || "",
            valorCarencia: u.valorCarencia ?? "", observacao: u.observacao || "", dataHoraAplicacao: exibirDataHoraLocal(atividade.dataHoraPrevista) })),
    }));
    const [confirmado, setConfirmado] = useState(false);
    const gravacao = useGravacao();
    const maximo = exibirDataHoraLocal(new Date());
    // Atualizar os dados da aplicação que está sendo preenchida
    function alterarUso(i, evento) {
        const { name, value } = evento.target;
        setConfirmado(false);
        setFormulario(f => ({ ...f, usosMedicamento: f.usosMedicamento.map((u, j) => j === i ? { ...u, [name]: value } : u) }));
    }
    // Conferir os dados e confirmar a conclusão da atividade
    function concluir(e) {
        e.preventDefault();
        if (!confirmado) { gravacao.setErro("Confirme os dados efetivos antes de concluir."); return; }
        let dados;
        try { dados = prepararConclusao(formulario, atividade); }
        catch (falha) { gravacao.setErro(falha.message); return; }
        gravacao.executar(() => service.concluir(atividade.codAtividade, dados), a => navegar(`/atividades/${a.codAtividade}`));
    }
    if (atividade.situacao !== "AGENDADA") return <p className="painel">Esta atividade já foi encerrada. <a href={`#/atividades/${atividade.codAtividade}`}>Ver detalhes</a></p>;
    return <form className="painel formulario-modulo" onSubmit={concluir} aria-busy={gravacao.salvando}>
        <p className="mensagem-aviso">Revise os dados realizados. Os valores do agendamento foram preenchidos como sugestão e podem ser alterados. A conclusão confirma as aplicações e registra a carência no animal.</p>
        {gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
        <fieldset disabled={gravacao.salvando}><legend>Realização da atividade</legend>
            <Campo titulo="Data e horário de encerramento (Brasília) *"><input type="datetime-local" name="dataHoraEncerramento" step="1" required max={maximo} value={formulario.dataHoraEncerramento}
                onChange={e => { setConfirmado(false); setFormulario(f => ({ ...f, dataHoraEncerramento: e.target.value })); }} /></Campo>
            <button type="button" className="botao-texto" onClick={() => { setConfirmado(false); setFormulario(f => ({ ...f, dataHoraEncerramento: exibirDataHoraLocal(new Date()) })); }}>Usar horário atual</button>
            {!!formulario.usosMedicamento.length && <button type="button" className="botao-secundario" onClick={() => { setConfirmado(false); setFormulario(f => ({ ...f, usosMedicamento: f.usosMedicamento.map(u => ({ ...u, dataHoraAplicacao: f.dataHoraEncerramento })) })); }}>Usar encerramento em todas as aplicações</button>}
        </fieldset>
        {formulario.usosMedicamento.map((uso, i) => {
            const original = atividade.usosMedicamento.find(u => u.codUso === uso.codUso);
            const animal = atividade.participacoes.find(p => p.codAnimal === original.codAnimal)?.animal;
            return <fieldset key={uso.codUso} disabled={gravacao.salvando}><legend>{original.medicamento?.nome || "Medicamento"} · {identificarAnimal(animal)}</legend><div className="grade-formulario">
                <Campo titulo="Aplicação efetiva (Brasília) *"><input name="dataHoraAplicacao" type="datetime-local" step="1" required max={maximo} value={uso.dataHoraAplicacao} onChange={e => alterarUso(i, e)} /></Campo>
                <Campo titulo="Dose efetiva *"><input name="dose" required maxLength={50} value={uso.dose} onChange={e => alterarUso(i, e)} /></Campo>
                <Campo titulo="Unidade da carência efetiva *"><select name="unidadeCarencia" required value={uso.unidadeCarencia} onChange={e => alterarUso(i, e)}><option value="">Selecione</option><option value="HORAS">Horas</option><option value="DIAS">Dias</option></select></Campo>
                <Campo titulo="Valor da carência efetiva *" ajuda="Informe zero quando não houver carência."><input name="valorCarencia" type="number" step="1" min="0" max="2147483647" required value={uso.valorCarencia} onChange={e => alterarUso(i, e)} /></Campo>
                <Campo titulo="Observação"><textarea name="observacao" rows={2} value={uso.observacao} onChange={e => alterarUso(i, e)} /></Campo>
            </div></fieldset>;
        })}
        {!formulario.usosMedicamento.length && <p className="nota-limite">Nenhum medicamento vinculado. Atividades sanitárias exigem uso de medicamento para cada participante; retorne aos detalhes para incluí-los.</p>}
        <label className="opcao-marcacao"><input name="confirmacao" type="checkbox" required checked={confirmado} disabled={gravacao.salvando} onChange={e => setConfirmado(e.target.checked)} />Confirmo os dados efetivos da realização e das aplicações.</label>
        <div className="acoes-modulo espaco-acima"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Concluindo…" : "Confirmar e concluir atividade"}</button>
            {!gravacao.salvando && <a className="botao-secundario" href={`#/atividades/${atividade.codAtividade}`}>Voltar sem concluir</a>}</div>
    </form>;
}

// Carregar a atividade que será concluída
export default function AtividadeConclusao({ codigo }) {
    const consulta = useConsulta(useCallback(signal => service.buscar(codigo, signal), [codigo]));
    return <main className="conteudo-dashboard pagina-atividades"><CabecalhoModulo titulo="Concluir atividade" descricao={consulta.dados?.titulo || "Confirme os horários, doses e carências efetivas."} />
        <EstadoConsulta consulta={consulta} />{consulta.dados && <FormularioConclusao atividade={consulta.dados} />}
    </main>;
}
