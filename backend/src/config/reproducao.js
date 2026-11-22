// Validar e retornar os parâmetros usados nas previsões reprodutivas
function obterParametros() {
    // Ler um parâmetro do ambiente e aplicar seu valor padrão
    const ler = (nome, padrao, minimo, maximo) => {
        const valor = process.env[nome] ?? String(padrao);
        if (!/^\d+$/.test(valor) || Number(valor) < minimo || Number(valor) > maximo) throw new Error(`Configuração inválida: ${nome}.`);
        return Number(valor);
    };
    const parametros = {
        diasGestacao: ler("REPRO_DIAS_GESTACAO", 280, 1, 1000),
        diasAntesPartoSecagem: ler("REPRO_DIAS_ANTES_PARTO_SECAGEM", 60, 0, 999),
        diasDiagnosticoMin: ler("REPRO_DIAS_DIAGNOSTICO_MIN", 28, 0, 1000),
        diasDiagnosticoMax: ler("REPRO_DIAS_DIAGNOSTICO_MAX", 35, 0, 1000),
        idadePrimeiraInseminacaoMeses: ler("REPRO_IDADE_PRIMEIRA_INSEMINACAO_MESES", 15, 1, 120),
        intervaloPosPartoDias: ler("REPRO_INTERVALO_POS_PARTO_DIAS", 60, 0, 1000),
    };
    if (parametros.diasAntesPartoSecagem > parametros.diasGestacao || parametros.diasDiagnosticoMin > parametros.diasDiagnosticoMax) throw new Error("Os intervalos reprodutivos configurados são incompatíveis.");
    return parametros;
}

module.exports = { obterParametros };
