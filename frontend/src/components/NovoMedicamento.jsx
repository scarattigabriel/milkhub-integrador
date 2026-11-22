import { useEffect, useRef, useState } from "react";
import service from "../services/medicamento.service.js";
import useGravacao from "../hooks/useGravacao.js";
import { Campo } from "./Modulo.jsx";

// Abrir o cadastro de medicamento sem sair da atividade
export default function NovoMedicamento({ onFechar, onCriado }) {
    const dialogo = useRef(null);
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const gravacao = useGravacao();
    useEffect(() => {
        const elemento = dialogo.current;
        elemento.showModal();
        return () => elemento.close();
    }, []);
    // Conferir os campos e enviar o cadastro
    function salvar(e) {
        e.preventDefault();
        if (!nome.trim() || nome.trim().length > 150) { gravacao.setErro("Informe o nome do medicamento com até 150 caracteres."); return; }
        gravacao.executar(() => service.criar({ nome: nome.trim(), descricao: descricao.trim() || null }), onCriado);
    }
    return <dialog ref={dialogo} className="dialogo-medicamento pagina-atividades" aria-labelledby="titulo-novo-medicamento"
        onCancel={e => { e.preventDefault(); if (!gravacao.salvando) onFechar(); }}>
        <h2 id="titulo-novo-medicamento">Cadastrar novo medicamento</h2>
        <form className="formulario-modulo" onSubmit={salvar}>
            {gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
            <fieldset disabled={gravacao.salvando}>
                <Campo titulo="Nome *"><input autoFocus required maxLength={150} value={nome} onInput={e => setNome(e.target.value)} /></Campo>
                <Campo titulo="Descrição"><textarea rows={3} value={descricao} onInput={e => setDescricao(e.target.value)} /></Campo>
            </fieldset>
            <div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : "Salvar medicamento"}</button>
                <button type="button" className="botao-secundario" disabled={gravacao.salvando} onClick={onFechar}>Cancelar</button></div>
        </form>
    </dialog>;
}
