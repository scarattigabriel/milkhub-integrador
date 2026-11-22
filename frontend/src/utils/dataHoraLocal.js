const formato = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

// Converter a data para preencher o campo de horário local
export function exibirDataHoraLocal(valor) {
    const p = Object.fromEntries(formato.formatToParts(new Date(valor)).map(parte => [parte.type, parte.value]));
    return `${p.year.padStart(4, "0")}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

// Converter o horário do formulário para envio à API
export function prepararDataHora(valor) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(valor || "")) throw new Error("Informe uma data e um horário válidos.");
    const completo = valor.length === 16 ? `${valor}:00` : valor;
    const alvo = new Date(`${completo}Z`);
    if (!Number.isFinite(alvo.getTime()) || alvo.getUTCFullYear() < 1 || alvo.toISOString().slice(0, 19) !== completo) throw new Error("A data e o horário informados não existem.");
    let instante = alvo.getTime();
    for (let i = 0; i < 5; i++) {
        const local = exibirDataHoraLocal(instante);
        if (local === completo) return new Date(instante).toISOString();
        instante += alvo.getTime() - new Date(`${local}Z`).getTime();
    }
    throw new Error("Esse horário não existe no fuso da propriedade. Escolha outro horário.");
}
