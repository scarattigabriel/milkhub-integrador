import "../styles/animais.css";
import { useCallback, useRef, useState } from "react";
import animalService from "../services/animal.service.js";
import useConsulta from "../hooks/useConsulta.js";
import usePaginaAtiva from "../hooks/usePaginaAtiva.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { filtrosIniciais } from "../utils/formatacao.js";
import obterMensagemErro from "../utils/obterMensagemErro.js";

// Registrar a saída do animal e preservar seu histórico
export default function AnimalSaida({ codigo }) {
    const consulta = useConsulta(useCallback(signal => animalService.buscar(codigo, signal), [codigo]));
    const [dados, setDados] = useState({ dataSaida: filtrosIniciais().dataAgenda, tipoSaida: "DESCARTE", motivoSaida: "" });
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);
    const trava = useRef(false);
    const ativa = usePaginaAtiva();
    const a = consulta.dados;
    // Conferir os campos e enviar o cadastro
    async function salvar(e) {
        e.preventDefault();
        if (trava.current) return;
        if (!dados.motivoSaida.trim()) { setErro("Informe o motivo da saída."); return; }
        trava.current = true; setSalvando(true); setErro("");
        try {
            await animalService.registrarSaida(codigo, { ...dados, motivoSaida: dados.motivoSaida.trim() });
            if (ativa.current) navegar(`/animais/${codigo}`);
        } catch (falha) { if (ativa.current) setErro(obterMensagemErro(falha)); }
        finally { trava.current = false; if (ativa.current) setSalvando(false); }
    }
    // Atualizar o campo preenchido no formulário
    const alterar = e => setDados(d => ({ ...d, [e.target.name]: e.target.value }));
    return <main className="conteudo-dashboard pagina-animais"><CabecalhoModulo titulo="Registrar saída" descricao={a ? `${a.nome} · Brinco ${a.brinco}` : "Informe o descarte ou óbito do animal."} />
        <EstadoConsulta consulta={consulta} />{a && (a.situacaoRebanho === "INATIVA" ? <p className="painel">Este animal já está inativo. <a href={`#/animais/${codigo}`}>Ver detalhes</a></p> :
            <form className="painel formulario-modulo" onSubmit={salvar} aria-busy={salvando}>
                <p className="mensagem-aviso">Ao confirmar, o animal ficará inativo. Seu histórico será preservado.</p>
                {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
                <fieldset disabled={salvando}><legend>Dados da saída</legend><div className="grade-formulario">
                    <Campo titulo="Data da saída *"><input name="dataSaida" type="date" required min={a.dataNascimento} max={filtrosIniciais().dataAgenda} value={dados.dataSaida} onChange={alterar} /></Campo>
                    <Campo titulo="Tipo *"><select name="tipoSaida" value={dados.tipoSaida} onChange={alterar}><option value="DESCARTE">Descarte / venda</option><option value="OBITO">Óbito</option></select></Campo>
                    <Campo titulo="Motivo *"><textarea name="motivoSaida" required maxLength={255} value={dados.motivoSaida} onChange={alterar} rows={3} /></Campo>
                </div></fieldset><div className="acoes-modulo"><button className="botao-primario" disabled={salvando}>{salvando ? "Registrando…" : "Confirmar saída"}</button>
                    {!salvando && <a className="botao-secundario" href={`#/animais/${codigo}`}>Cancelar</a>}</div>
            </form>)}
    </main>;
}
