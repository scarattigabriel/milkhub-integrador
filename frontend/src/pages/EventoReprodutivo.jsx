import SeletorAnimal from "../components/SeletorAnimalReproducao.jsx";
import IdentificacaoAnimal from "../components/IdentificacaoAnimal.jsx";
import "../styles/reproducao.css";
import { useCallback, useState } from "react";
import service from "../services/reproducao.service.js";
import animalService from "../services/animal.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { filtrosIniciais, dataCivil, rotulo } from "../utils/formatacao.js";
import { prepararEvento, criasElegiveis } from "../utils/reproducao.js";

// Mostrar os campos de parto, secagem ou perda gestacional
export function FormularioEvento({ tipo, animais, gestacoes, gestacao = null }) {
    const [f, setF] = useState({ codAnimal: gestacao ? String(gestacao.codAnimal) : "", codGestacao: gestacao ? String(gestacao.codGestacao) : "", data: filtrosIniciais().dataAgenda, observacao: "", historico: false, crias: [] });
    const [confirmado, setConfirmado] = useState(false);
    const gravacao = useGravacao();
    const perda = tipo === "perdas", parto = tipo === "partos";
    const mae = animais.find(a => String(a.codAnimal) === f.codAnimal);
    const candidatas = criasElegiveis(animais, f);
    // Atualizar o campo preenchido no formulário
    function alterar(e) {
        const { name, type, checked, value } = e.target;
        setConfirmado(false);
        setF(atual => ({ ...atual, [name]: type === "checkbox" ? checked : value, ...(["codAnimal", "data"].includes(name) ? { crias: [] } : {}), ...(name === "codAnimal" ? { codGestacao: "" } : {}) }));
    }
    // Conferir os campos e enviar o cadastro
    function salvar(e) {
        e.preventDefault();
        if (!confirmado) { gravacao.setErro("Confirme os dados do evento antes de registrar."); return; }
        if (f.crias.some(id => !candidatas.some(a => String(a.codAnimal) === id))) { gravacao.setErro("Revise as crias: elas devem nascer na data do parto e pertencer à mesma mãe."); return; }
        let dados; try { dados = prepararEvento(tipo, f); } catch (falha) { gravacao.setErro(falha.message); return; }
        gravacao.executar(() => perda ? service.perda(gestacao.codGestacao, dados) : service.registrar(tipo, dados), r => navegar(r.codGestacao ? `/reproducao/gestacoes/${r.codGestacao}` : `/reproducao/${tipo}`));
    }
    if (gestacao && gestacao.situacao !== "EM_ANDAMENTO") return <p className="painel">Esta gestação já está encerrada. <a className="botao-secundario" href={`#/reproducao/gestacoes/${gestacao.codGestacao}`}>Ver gestação</a></p>;
    return <form className="painel formulario-modulo" onSubmit={salvar} aria-busy={gravacao.salvando}>
        {gravacao.erro && <p role="alert" className="mensagem-erro">{gravacao.erro}</p>}
        <p className="mensagem-aviso">{perda ? "A perda encerra a gestação e atualiza a prenhez." : parto ? "O parto encerra a gestação e atualiza a prenhez e a lactação." : "A secagem atualiza a lactação e preserva a prenhez."} Registros históricos não alteram o estado atual.</p>
        <fieldset disabled={gravacao.salvando}><legend>Dados do evento</legend><div className="grade-formulario">
            <SeletorAnimal animais={animais.filter(a => a.sexo === "F")} disabled={Boolean(gestacao)} value={f.codAnimal} onChange={alterar} />
            <Campo titulo={perda ? "Data da perda *" : parto ? "Data do parto *" : "Data da secagem *"}><input name="data" type="date" required min={mae?.dataNascimento || "0001-01-01"} max={filtrosIniciais().dataAgenda} value={f.data} onChange={alterar} /></Campo>
            {!perda && <Campo titulo="Gestação vinculada"><select name="codGestacao" value={f.codGestacao} disabled={Boolean(gestacao)} onChange={alterar}><option value="">{f.historico ? "Sem vínculo" : "Ciclo atual, quando existir"}</option>{gestacoes.filter(g => String(g.codAnimal) === f.codAnimal && (g.situacao === "EM_ANDAMENTO" || (!parto && f.historico))).map(g => <option key={g.codGestacao} value={g.codGestacao}>{rotulo(g.situacao)} - Parto previsto {dataCivil(g.dataPrevisaoParto)}</option>)}</select></Campo>}
            <Campo titulo="Observação"><textarea name="observacao" rows={3} value={f.observacao} onChange={alterar} /></Campo>
        </div><label className="opcao-marcacao espaco-acima"><input name="historico" type="checkbox" checked={f.historico} onChange={alterar} />Registro histórico, sem alterar o estado atual</label>
            {parto && <><h2 className="titulo-secao">Crias do parto</h2><p className="nota-limite">Selecione as crias cadastradas com nascimento na data do parto.</p>
                <div className="selecao-animais">{candidatas.map(a => <label className="opcao-marcacao" key={a.codAnimal}><input type="checkbox" checked={f.crias.includes(String(a.codAnimal))} onChange={e => { setConfirmado(false); setF(atual => ({ ...atual, crias: e.target.checked ? [...atual.crias, String(a.codAnimal)] : atual.crias.filter(id => id !== String(a.codAnimal)) })); }} /><IdentificacaoAnimal animal={a} /></label>)}</div>{!candidatas.length && <p className="nota-limite">Nenhuma cria elegível cadastrada para esta data.</p>}</>}
            <label className="opcao-marcacao espaco-acima"><input name="confirmacaoEvento" type="checkbox" required checked={confirmado} onChange={e => setConfirmado(e.target.checked)} />Confirmo o animal, a data e os dados deste evento.</label>
        </fieldset><div className="acoes-modulo"><button className={perda ? "botao-perigo" : "botao-primario"} disabled={gravacao.salvando}>{gravacao.salvando ? "Registrando…" : perda ? "Confirmar perda" : parto ? "Registrar parto" : "Registrar secagem"}</button>
            {!gravacao.salvando && <a className="botao-secundario" href={gestacao ? `#/reproducao/gestacoes/${gestacao.codGestacao}` : `#/reproducao/${tipo}`}>Cancelar</a>}</div>
    </form>;
}
// Carregar os dados para registrar o evento reprodutivo
export default function EventoReprodutivo({ tipo, origem }) {
    const consulta = useConsulta(useCallback(async signal => { const [animais, gestacoes, gestacao] = await Promise.all([animalService.listar({}, signal), service.listar("gestacoes", {}, signal), origem ? service.buscar("gestacoes", origem, signal) : Promise.resolve(null)]); return { animais, gestacoes, gestacao }; }, [origem]));
    return <main className="conteudo-dashboard pagina-reproducao"><CabecalhoModulo titulo={tipo === "perdas" ? "Registrar perda gestacional" : tipo === "partos" ? "Registrar parto" : "Registrar secagem"} descricao="Informe o evento realizado e preserve os vínculos do histórico reprodutivo." /><EstadoConsulta consulta={consulta} />{consulta.dados && <FormularioEvento {...consulta.dados} tipo={tipo} />}</main>;
}
