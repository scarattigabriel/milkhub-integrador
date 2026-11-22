import Marca from "./Marca.jsx";
import { useEffect, useRef, useState } from "react";
import "../styles/modulos.css";
import "../styles/navbar.css";

// Montar a navegação e o espaço das telas do sistema
export default function Layout({ usuario, onSair, pagina, rota = pagina, children }) {
    const [menuAberto, setMenuAberto] = useState(false);
    const botaoMenu = useRef(null);
    const iniciais = usuario.nome.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join("").toUpperCase();
    useEffect(() => {
        setMenuAberto(false);
        document.getElementById("conteudo-principal")?.focus();
    }, [rota]);
    return <div className="pagina-dashboard milkhub-interno">
        <a className="pular-conteudo" href="#conteudo-principal" onClick={e => {
            e.preventDefault(); document.getElementById("conteudo-principal")?.focus();
        }}>Pular para o conteúdo</a>
        <div className="barra-milkhub">
        <header className="cabecalho-dashboard"><a className="link-marca" href="#/dashboard" aria-label="MilkHub — página inicial"><Marca /></a><button ref={botaoMenu} type="button" className="botao-secundario menu-toggle" aria-expanded={menuAberto} aria-controls="menu-principal" onClick={() => setMenuAberto(v => !v)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">{menuAberto ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}</svg>{menuAberto ? "Fechar menu" : "Menu"}</button><div className="acoes-usuario">
            <span className="avatar-usuario" aria-hidden="true">{iniciais}</span><div className="identidade-usuario"><strong>{usuario.nome}</strong><span>{usuario.perfil === "GESTOR" ? "Gestor" : "Colaborador"}</span></div>
            <button className="botao-secundario sair-navbar" onClick={onSair}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4H4v16h5M14 8l4 4-4 4M8 12h12" /></svg>Sair</button>
        </div></header>
        <nav id="menu-principal" className={`navegacao-principal${menuAberto ? " menu-aberto" : ""}`} aria-label="Menu principal" onKeyDown={e => {
            if (e.key === "Escape" && menuAberto) { setMenuAberto(false); botaoMenu.current?.focus(); }
        }}>
            {[["dashboard", "Dashboard"], ["animais", "Animais"], ["atividades", "Atividades"], ["carencias", "Carências"], ["reproducao", "Reprodução"], ["leite", "Coleta de leite"], ...(usuario.perfil === "GESTOR" ? [["financeiro", "Financeiro"], ["usuarios", "Usuários"]] : [])].map(([destino, nome]) => {
                const ativo = destino === "animais" ? pagina === "animais" || pagina.startsWith("animal-") : destino === "atividades" ? pagina === "atividades" || pagina.startsWith("atividade-") : destino === "reproducao" ? pagina.startsWith("repro-") || ["reproducao", "reprodutores", "inseminacao-form", "inseminacao-detalhe"].includes(pagina) : destino === "leite" ? pagina === "leite" || pagina.startsWith("leite-") : destino === "financeiro" ? pagina.startsWith("financeiro-") : pagina === destino;
                return <a key={destino} href={`#/${destino}`} onClick={() => { setMenuAberto(false); document.getElementById("conteudo-principal")?.focus(); }} aria-current={(destino === "usuarios" ? pagina === "usuarios" || pagina.startsWith("usuario-") : ativo) ? "page" : undefined}>{nome}</a>;
            })}
        </nav>
        </div>
        <div id="conteudo-principal" tabIndex="-1">{children}</div>
    </div>;
}
