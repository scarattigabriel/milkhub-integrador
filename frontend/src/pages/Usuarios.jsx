import { useCallback, useEffect, useState } from "react";
import service from "../services/usuario.service.js";
import useConsulta from "../hooks/useConsulta.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { perdeAcessoGestao } from "../utils/usuario.js";

// Mostrar as contas e as ações disponíveis
export function TabelaUsuarios({ usuarios, usuarioAtual, onSituacao, salvando }) {
    return <div className="tabela-rolagem" role="region" tabIndex="0" aria-label="Tabela com rolagem horizontal"><table className="tabela-modulo"><caption className="somente-leitor">Usuários cadastrados</caption><thead><tr><th>Nome</th><th>Login</th><th>Perfil</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{usuarios.map(u => <tr key={u.codUsuario}><th scope="row">{u.nome}{u.codUsuario === usuarioAtual.codUsuario && <small>Sua conta</small>}</th><td>{u.login}</td><td>{u.perfil === "GESTOR" ? "Gestor" : "Colaborador"}</td><td>{u.ativo ? "Ativo" : "Inativo"}</td><td className="acoes-tabela"><a href={`#/usuarios/${u.codUsuario}/editar`}>Editar</a><a href={`#/usuarios/${u.codUsuario}/senha`}>Alterar senha</a><button className="botao-texto" disabled={salvando} onClick={() => onSituacao?.(u)}>{u.ativo ? "Desativar" : "Ativar"}</button></td></tr>)}</tbody></table></div>;
}
// Listar as contas e permitir filtrar os acessos
export default function Usuarios({ usuarioAtual, onAtualizado }) {
    const [formulario, setFormulario] = useState({ busca: "", perfil: "", ativo: "" });
    const [filtros, setFiltros] = useState({ pagina: 1, limite: 15 });
    const [confirmacao, setConfirmacao] = useState(null);
    const [mensagem, setMensagem] = useState("");
    const gravacao = useGravacao();
    const consulta = useConsulta(useCallback(signal => service.listar(filtros, signal), [filtros]));
    // Atualizar o campo preenchido no formulário
    const alterar = e => setFormulario(f => ({ ...f, [e.target.name]: e.target.value }));
    const p = consulta.dados?.paginacao;
    useEffect(() => {
        if (p && p.pagina > Math.max(1, p.paginas)) setFiltros(f => ({ ...f, pagina: Math.max(1, p.paginas) }));
    }, [p]);
    // Pedir confirmação e ativar ou desativa a conta
    function confirmarSituacao() {
        gravacao.executar(() => service.atualizar(confirmacao.codUsuario, { ativo: !confirmacao.ativo }), u => {
            setConfirmacao(null); onAtualizado?.(u);
            if (perdeAcessoGestao(usuarioAtual, u)) navegar("/dashboard");
            else { setMensagem(u.ativo ? "Usuário ativado." : "Usuário desativado."); consulta.recarregar(); }
        });
    }
    return <main className="conteudo-dashboard pagina-usuarios"><CabecalhoModulo titulo="Usuários" descricao="Gerencie os acessos de gestores e colaboradores da propriedade."><a className="botao-primario" href="#/usuarios/novo">Cadastrar usuário</a></CabecalhoModulo>
        <form className="painel filtros-modulo" onSubmit={e => { e.preventDefault(); setFiltros({ ...formulario, pagina: 1, limite: 15 }); }}>
            <Campo titulo="Nome ou login"><input name="busca" maxLength={150} value={formulario.busca} onChange={alterar} /></Campo>
            <Campo titulo="Perfil"><select name="perfil" value={formulario.perfil} onChange={alterar}><option value="">Todos</option><option value="GESTOR">Gestor</option><option value="COLABORADOR">Colaborador</option></select></Campo>
            <Campo titulo="Situação"><select name="ativo" value={formulario.ativo} onChange={alterar}><option value="">Todas</option><option value="true">Ativos</option><option value="false">Inativos</option></select></Campo>
            <button className="botao-primario" disabled={consulta.carregando}>Filtrar</button><button type="button" className="botao-secundario" disabled={consulta.carregando} onClick={() => { setFormulario({ busca: "", perfil: "", ativo: "" }); setFiltros({ pagina: 1, limite: 15 }); }}>Limpar</button>
        </form>{gravacao.erro && <p role="alert" className="mensagem-erro">{gravacao.erro}</p>}{mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
        {confirmacao && <section className="painel confirmar-exclusao"><h2>{confirmacao.ativo ? "Desativar" : "Ativar"} {confirmacao.nome}?</h2><p>{confirmacao.ativo ? "A conta não poderá entrar nem continuar usando a API enquanto estiver inativa." : "A conta poderá entrar novamente com sua senha."} É necessário manter ao menos um gestor ativo.</p>{confirmacao.codUsuario === usuarioAtual.codUsuario && <p className="mensagem-aviso">Esta é sua própria conta. A desativação encerra seu acesso nesta aba.</p>}<div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando} onClick={confirmarSituacao}>{gravacao.salvando ? "Salvando…" : "Confirmar alteração de situação"}</button><button className="botao-secundario" disabled={gravacao.salvando} onClick={() => setConfirmacao(null)}>Cancelar</button></div></section>}
        <EstadoConsulta consulta={consulta} />{consulta.dados && <section className="painel"><p className="resumo-listagem" role="status">{p.total} usuários encontrados</p>{consulta.dados.usuarios.length ? <TabelaUsuarios usuarios={consulta.dados.usuarios} usuarioAtual={usuarioAtual} onSituacao={u => { setConfirmacao(u); setMensagem(""); gravacao.setErro(""); }} salvando={gravacao.salvando} /> : <p>Nenhum usuário corresponde aos filtros.</p>}
            {p.paginas > 1 && <nav className="paginacao" aria-label="Páginas de usuários"><button className="botao-secundario" disabled={p.pagina <= 1 || consulta.carregando} onClick={() => setFiltros(f => ({ ...f, pagina: p.pagina - 1 }))}>Anterior</button><span>Página {p.pagina} de {p.paginas}</span><button className="botao-secundario" disabled={p.pagina >= p.paginas || consulta.carregando} onClick={() => setFiltros(f => ({ ...f, pagina: p.pagina + 1 }))}>Próxima</button></nav>}
        </section>}
    </main>;
}
