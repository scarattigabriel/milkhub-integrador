// Mostrar os atalhos das telas do financeiro
export default function AbasFinanceiro({ tipo }) {
    return <nav className="acoes-modulo abas-reproducao" aria-label="Financeiro">{[["resumo", "Resumo"], ["custos", "Custos"], ["receitas", "Receitas"]].map(([codigo, nome]) =>
        <a className="botao-secundario" key={codigo} href={`#/financeiro/${codigo}`} aria-current={tipo === codigo ? "page" : undefined}>{nome}</a>)}</nav>;
}
