import { useRef, useState } from "react";
import usePaginaAtiva from "./usePaginaAtiva.js";
import obterMensagemErro from "../utils/obterMensagemErro.js";

// Cuidar do envio, do carregamento e dos erros ao salvar
export default function useGravacao() {
    const ativa = usePaginaAtiva();
    const trava = useRef(false);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    // Enviar a operação sem repetir cliques e tratar o resultado
    async function executar(operacao, aoConcluir) {
        if (trava.current) return;
        trava.current = true; setSalvando(true); setErro("");
        try {
            const resultado = await operacao();
            if (ativa.current) aoConcluir?.(resultado);
        } catch (falha) { if (ativa.current) setErro(obterMensagemErro(falha)); }
        finally { trava.current = false; if (ativa.current) setSalvando(false); }
    }
    return { salvando, erro, setErro, executar };
}
