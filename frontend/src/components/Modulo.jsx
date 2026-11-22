// Mostrar o título da tela e suas ações principais
export function CabecalhoModulo({ titulo, descricao, children }) {
    return <div className="abertura-dashboard"><div><span className="legenda-login">GESTÃO DA PROPRIEDADE</span>
        <h1>{titulo}</h1><p>{descricao}</p></div><div className="acoes-modulo">{children}</div></div>;
}

// Mostrar carregamento, erro ou o conteúdo da consulta
export function EstadoConsulta({ consulta }) {
    if (consulta.carregando) return <p className="painel estado-dashboard" role="status">Carregando os registros…</p>;
    if (consulta.erro) return <div className="painel estado-dashboard"><p role="alert" className="mensagem-erro">{consulta.erro}</p>
        <button className="botao-secundario" onClick={consulta.recarregar}>Tentar novamente</button></div>;
    return null;
}

// Juntar o rótulo e o campo do formulário
export function Campo({ titulo, children, ajuda }) {
    return <label className="campo-modulo"><span>{titulo}</span>{children}{ajuda && <small>{ajuda}</small>}</label>;
}

// Mostrar a situação com a cor correspondente
export function Situacao({ valor }) {
    return <span className={`situacao-registro ${valor === "ATIVA" ? "situacao-ativa" : "situacao-inativa"}`}>{valor === "ATIVA" ? "Ativo" : "Inativo"}</span>;
}
