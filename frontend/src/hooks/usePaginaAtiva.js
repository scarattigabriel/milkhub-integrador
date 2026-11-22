import { useEffect, useRef } from "react";

// Conferir se a tela continua aberta antes de atualizar seu estado
export default function usePaginaAtiva() {
    const ativa = useRef(true);
    useEffect(() => {
        ativa.current = true;
        return () => { ativa.current = false; };
    }, []);
    return ativa;
}
