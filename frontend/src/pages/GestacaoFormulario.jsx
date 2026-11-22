import SeletorAnimal from "../components/SeletorAnimalReproducao.jsx";
import "../styles/reproducao.css";
import { useCallback, useState } from "react";
import service from "../services/reproducao.service.js";
import animalService from "../services/animal.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import Previsoes from "../components/PrevisoesReprodutivas.jsx";
import { prepararGestacao, prepararPrevisoes } from "../utils/reproducao.js";

// Mostrar os campos para cadastrar uma gestação
export function FormularioGestacao({ animais = [], original = null }) {
    const [f, setF] = useState({ codAnimal: "", observacao: original?.observacao || "", previsoesManuais: false, recalcularSecagem: true,
        dataPrevisaoParto: original?.dataPrevisaoParto || "", dataPrevistaSecagem: original?.dataPrevistaSecagem || "" });
    const gravacao = useGravacao();
    // Conferir os campos e enviar o cadastro
    function salvar(e) { e.preventDefault(); let dados; try { dados = original ? prepararPrevisoes(f, original) : prepararGestacao(f); } catch (falha) { gravacao.setErro(falha.message); return; }
        gravacao.executar(() => original ? service.ajustar(original.codGestacao, dados) : service.registrar("gestacoes", dados), g => navegar(`/reproducao/gestacoes/${g.codGestacao}`)); }
    return <form className="painel formulario-modulo" onSubmit={salvar}>{gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
        <fieldset disabled={gravacao.salvando}><legend>{original ? "Ajustar previsões" : "Animal adquirido prenhe"}</legend>
            {!original && <><p className="nota-limite">Para fêmeas adquiridas prenhes, sem inseminação conhecida.</p><SeletorAnimal animais={animais.filter(a => a.prenha === "S")} value={f.codAnimal} onChange={e => setF(v => ({ ...v, codAnimal: e.target.value }))} /></>}
            <Previsoes dados={f} onAlterar={setF} ajuste={Boolean(original)} /><Campo titulo="Observação"><textarea rows={3} value={f.observacao} onChange={e => setF(v => ({ ...v, observacao: e.target.value }))} /></Campo>
        </fieldset><div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : "Salvar gestação"}</button>{!gravacao.salvando && <a className="botao-secundario" href={original ? `#/reproducao/gestacoes/${original.codGestacao}` : "#/reproducao/gestacoes"}>Cancelar</a>}</div>
    </form>;
}
// Carregar os animais disponíveis para o cadastro da gestação
export default function GestacaoFormulario({ codigo }) {
    const consulta = useConsulta(useCallback(async signal => codigo ? { original: await service.buscar("gestacoes", codigo, signal) } : { animais: await animalService.listar({ sexo: "F", situacaoRebanho: "ATIVA", prenha: "S" }, signal) }, [codigo]));
    return <main className="conteudo-dashboard pagina-reproducao"><CabecalhoModulo titulo={codigo ? "Ajustar previsões" : "Registrar gestação adquirida"} descricao="Mantenha as datas previstas para parto e secagem." /><EstadoConsulta consulta={consulta} />{consulta.dados && (consulta.dados.original && consulta.dados.original.situacao !== "EM_ANDAMENTO" ? <p className="painel">Gestações encerradas não permitem ajuste de previsões.</p> : <FormularioGestacao {...consulta.dados} />)}</main>;
}
