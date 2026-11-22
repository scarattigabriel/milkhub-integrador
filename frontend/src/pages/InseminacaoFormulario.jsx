import SeletorAnimal from "../components/SeletorAnimalReproducao.jsx";
import "../styles/reproducao.css";
import { useCallback, useState } from "react";
import service from "../services/reproducao.service.js";
import animalService from "../services/animal.service.js";
import reprodutorService from "../services/reprodutor.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { filtrosIniciais } from "../utils/formatacao.js";
import { prepararInseminacao, somarDiasCivil } from "../utils/reproducao.js";

// Mostrar os campos da inseminação e do exame opcional
export function FormularioInseminacao({ animais, reprodutores, parametros }) {
    const [formulario, setFormulario] = useState({ codAnimal: "", codReprodutor: "", dataInseminacao: filtrosIniciais().dataAgenda, tipoSemen: "", lote: "", observacao: "", dataHoraDiagnostico: "", historico: false });
    const gravacao = useGravacao();
    // Atualizar o campo preenchido no formulário
    const alterar = e => setFormulario(f => ({ ...f, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
    // Conferir os campos e enviar o cadastro
    function salvar(e) { e.preventDefault(); let dados; try { dados = prepararInseminacao(formulario); } catch (falha) { gravacao.setErro(falha.message); return; } gravacao.executar(() => service.registrar("inseminacoes", dados), r => navegar(`/reproducao/inseminacoes/${r.codInseminacao}`)); }
    // Calcular as datas sugeridas usando os parâmetros do sistema
    function sugerir() {
        try { const dia = somarDiasCivil(formulario.dataInseminacao, parametros.diasDiagnosticoMin); setFormulario(f => ({ ...f, dataHoraDiagnostico: `${dia}T08:00` })); }
        catch (falha) { gravacao.setErro(falha.message); }
    }
    return <form className="painel formulario-modulo" onSubmit={salvar}>{gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
        <fieldset disabled={gravacao.salvando}><legend>Inseminação realizada</legend><div className="grade-formulario">
            <SeletorAnimal animais={animais} value={formulario.codAnimal} onChange={alterar} />
            <Campo titulo="Reprodutor *"><select name="codReprodutor" required value={formulario.codReprodutor} onChange={alterar}><option value="">Selecione</option>{reprodutores.map(r => <option key={r.codReprodutor} value={r.codReprodutor}>{r.nome}{r.numeroRegistro ? ` (Registro ${r.numeroRegistro})` : ""}</option>)}</select></Campo>
            <Campo titulo="Data da inseminação *"><input name="dataInseminacao" type="date" required min="0001-01-01" max={filtrosIniciais().dataAgenda} value={formulario.dataInseminacao} onChange={alterar} /></Campo>
            <Campo titulo="Tipo de sêmen"><input name="tipoSemen" maxLength={50} value={formulario.tipoSemen} onChange={alterar} list="tipos-semen" /><datalist id="tipos-semen"><option value="CONVENCIONAL" /><option value="SEXADO" /></datalist></Campo>
            <Campo titulo="Lote"><input name="lote" maxLength={50} value={formulario.lote} onChange={alterar} /></Campo>
            <Campo titulo="Observação"><textarea name="observacao" rows={3} value={formulario.observacao} onChange={alterar} /></Campo>
        </div><label className="opcao-marcacao espaco-acima"><input name="historico" type="checkbox" checked={formulario.historico} onChange={alterar} />Registro histórico, sem alterar o ciclo atual</label></fieldset>
        <fieldset disabled={gravacao.salvando}><legend>Agendar diagnóstico (opcional)</legend><p className="nota-limite">Sugestão: {parametros.diasDiagnosticoMin} a {parametros.diasDiagnosticoMax} dias após a inseminação.</p>
            <Campo titulo="Data e horário do exame (Brasília)"><input name="dataHoraDiagnostico" type="datetime-local" disabled={formulario.historico} value={formulario.dataHoraDiagnostico} onChange={alterar} /></Campo>
            <div className="acoes-modulo espaco-acima"><button type="button" className="botao-secundario" disabled={formulario.historico || !formulario.dataInseminacao} onClick={sugerir}>Sugerir data</button><button type="button" className="botao-secundario" onClick={() => setFormulario(f => ({ ...f, dataHoraDiagnostico: "" }))}>Não agendar exame</button></div>
        </fieldset><div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Registrando…" : "Registrar inseminação"}</button>{!gravacao.salvando && <a className="botao-secundario" href="#/reproducao">Cancelar</a>}</div>
        {!reprodutores.length && <p className="nota-limite">Cadastre um reprodutor antes de registrar a inseminação.</p>}
    </form>;
}
// Carregar os dados para registrar a inseminação
export default function InseminacaoFormulario() {
    const consulta = useConsulta(useCallback(async signal => { const [animais, reprodutores, parametros] = await Promise.all([animalService.listar({ sexo: "F" }, signal), reprodutorService.listar({}, signal), service.parametros(signal)]); return { animais, reprodutores, parametros }; }, []));
    return <main className="conteudo-dashboard pagina-reproducao"><CabecalhoModulo titulo="Registrar inseminação" descricao="Registre a realização e, se desejar, agende o diagnóstico." /><EstadoConsulta consulta={consulta} />{consulta.dados && <FormularioInseminacao {...consulta.dados} />}</main>;
}
