import { useEffect, useState } from "react";

// Manter o horário usado nos alertas atualizado
export default function useAgora() {
    const [agora, setAgora] = useState(Date.now);
    useEffect(() => {
        // Atualizar o horário usado nos alertas
        const atualizar = () => setAgora(Date.now());
        const intervalo = setInterval(atualizar, 30000);
        window.addEventListener("focus", atualizar);
        return () => { clearInterval(intervalo); window.removeEventListener("focus", atualizar); };
    }, []);
    return agora;
}
