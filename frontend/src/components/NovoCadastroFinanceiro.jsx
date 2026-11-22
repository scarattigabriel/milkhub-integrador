import { useEffect, useRef, useState } from "react";
import service from "../services/financeiro.service.js";
import useGravacao from "../hooks/useGravacao.js";
import { prepararCatalogo } from "../utils/leiteFinanceiro.js";
import { Campo } from "./Modulo.jsx";
import "../styles/novo-tipo-financeiro.css";

// Abrir o cadastro de tipo ou fornecedor dentro do formulário
export default function NovoCadastroFinanceiro({ catalogo, onFechar, onCriado }) {
    const fornecedor = catalogo === "fornecedores";
    const nomeCadastro = fornecedor ? "fornecedor" : `tipo de ${catalogo === "tipos-custo" ? "custo" : "receita"}`;
    const dialogo = useRef(null);
    const [nome, setNome] = useState("");
    const [contato, setContato] = useState("");
    const gravacao = useGravacao();

    useEffect(() => {
        const elemento = dialogo.current;
        elemento.showModal();
        return () => elemento.close();
    }, []);

    // Conferir os campos e enviar o cadastro
    function salvar(evento) {
        evento.preventDefault();
        let dados;
        try { dados = prepararCatalogo(catalogo, { nome, contato }); }
        catch (falha) { gravacao.setErro(falha.message); return; }
        gravacao.executar(() => service.criar(catalogo, dados), onCriado);
    }

    return <dialog ref={dialogo} className="dialogo-tipo-financeiro pagina-financeiro" aria-labelledby="titulo-novo-tipo-financeiro"
        onCancel={evento => { evento.preventDefault(); if (!gravacao.salvando) onFechar(); }}>
        <h2 id="titulo-novo-tipo-financeiro">Criar novo {nomeCadastro}</h2>
        <form className="formulario-modulo" onSubmit={salvar}>
            {gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
            <fieldset disabled={gravacao.salvando}>
                <Campo titulo="Nome *"><input autoFocus required maxLength={fornecedor ? 150 : 100} value={nome} onInput={e => setNome(e.target.value)} /></Campo>
                {fornecedor && <Campo titulo="Contato"><input maxLength={150} value={contato} onInput={e => setContato(e.target.value)} /></Campo>}
            </fieldset>
            <div className="acoes-modulo">
                <button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : `Salvar ${nomeCadastro}`}</button>
                <button type="button" className="botao-secundario" disabled={gravacao.salvando} onClick={onFechar}>Cancelar</button>
            </div>
        </form>
    </dialog>;
}
