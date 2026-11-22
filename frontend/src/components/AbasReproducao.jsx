// Mostrar os atalhos do controle reprodutivo
export default function AbasReproducao({ tipo }) {
    return <nav className="acoes-modulo abas-reproducao" aria-label="Registros reprodutivos">{[["inseminacoes", "Inseminações"], ["diagnosticos", "Diagnósticos"], ["gestacoes", "Gestações"], ["secagens", "Secagens"], ["partos", "Partos"]].map(([codigo, nome]) =>
        <a key={codigo} className="botao-secundario" aria-current={tipo === codigo ? "page" : undefined} href={codigo === "inseminacoes" ? "#/reproducao" : `#/reproducao/${codigo}`}>{nome}</a>)}</nav>;
}
