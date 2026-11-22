import { useEffect, useRef, useState } from "react";
import racaService from "../services/raca.service.js";
import useGravacao from "../hooks/useGravacao.js";
import { Campo } from "./Modulo.jsx";

// Abrir o cadastro de raça sem sair do formulário
export default function NovaRaca({ onFechar, onCriada }) {
    const dialogo = useRef(null);
    const [nome, setNome] = useState("");
    const gravacao = useGravacao();

    useEffect(() => {
        const elemento = dialogo.current;
        elemento.showModal();
        return () => elemento.close();
    }, []);

    // Conferir os campos e enviar o cadastro
    function salvar(evento) {
        evento.preventDefault();
        if (!nome.trim() || nome.trim().length > 100) {
            gravacao.setErro("Informe o nome da raça com até 100 caracteres.");
            return;
        }
        gravacao.executar(() => racaService.criar(nome), onCriada);
    }

    return <dialog ref={dialogo} className="dialogo-raca pagina-animais" aria-labelledby="titulo-nova-raca"
        onCancel={evento => { evento.preventDefault(); if (!gravacao.salvando) onFechar(); }}>
        <h2 id="titulo-nova-raca">Cadastrar nova raça</h2>
        <form className="formulario-modulo" onSubmit={salvar}>
            {gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
            <fieldset disabled={gravacao.salvando}>
                <Campo titulo="Nome da raça *"><input autoFocus required maxLength={100} value={nome} onInput={e => setNome(e.target.value)} /></Campo>
            </fieldset>
            <div className="acoes-modulo">
                <button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : "Salvar raça"}</button>
                <button type="button" className="botao-secundario" disabled={gravacao.salvando} onClick={onFechar}>Cancelar</button>
            </div>
        </form>
    </dialog>;
}
