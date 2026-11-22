import { useEffect, useState } from "react";
import obterMensagemErro from "../utils/obterMensagemErro.js";

// Carregar os dados e cancelar consultas antigas ao sair da tela
export default function useConsulta(carregar) {
    const [estado, setEstado] = useState({ dados: null, carregando: true, erro: "" });
    const [versao, setVersao] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setEstado({ dados: null, carregando: true, erro: "" });
        carregar(controller.signal).then(dados => {
            if (!controller.signal.aborted) setEstado({ dados, carregando: false, erro: "" });
        }).catch(erro => {
            if (!controller.signal.aborted) setEstado({ dados: null, carregando: false, erro: obterMensagemErro(erro) });
        });
        return () => controller.abort();
    }, [carregar, versao]);
    return { ...estado,
        // Refazer a consulta para atualizar os dados da tela
        recarregar: () => setVersao(v => v + 1) };
}
