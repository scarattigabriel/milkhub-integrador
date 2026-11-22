import { useCallback, useState } from "react";
import service from "../services/usuario.service.js";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { prepararUsuario, perdeAcessoGestao } from "../utils/usuario.js";
import useConsulta from "../hooks/useConsulta.js";

// Mostrar os campos da conta e suas permissões
export function FormularioUsuario({ original = null, usuarioAtual, onAtualizado } = {}) {
    const [f, setF] = useState({ nome: original?.nome || "", login: original?.login || "", perfil: original?.perfil || "COLABORADOR", ativo: original?.ativo ?? true, senha: "", confirmacao: "" });
    const [mostrar, setMostrar] = useState(false);
    const [confirmarPerfil, setConfirmarPerfil] = useState(false);
    const gravacao = useGravacao();
    // Atualizar o campo preenchido no formulário
    const alterar = e => { if (e.target.name === "perfil") setConfirmarPerfil(false); setF(v => ({ ...v, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value })); };
    const mudouPerfil = original && f.perfil !== original.perfil;
    // Conferir os campos e enviar o cadastro
    function salvar(e) { e.preventDefault();
        if (mudouPerfil && !confirmarPerfil) { gravacao.setErro("Confirme a alteração de perfil antes de salvar."); return; }
        let dados; try { dados = prepararUsuario(f, original); } catch (falha) { gravacao.setErro(falha.message); return; }
        gravacao.executar(() => original ? service.atualizar(original.codUsuario, dados) : service.criar(dados), u => {
            if (original) onAtualizado?.(u);
            navegar(perdeAcessoGestao(usuarioAtual, u) ? "/dashboard" : "/usuarios");
        }); }
    return <form className="painel formulario-modulo" onSubmit={salvar} aria-busy={gravacao.salvando}>{gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
        <fieldset disabled={gravacao.salvando}><legend>Identificação e acesso</legend><div className="grade-formulario">
            <Campo titulo="Nome completo *"><input name="nome" maxLength={150} required value={f.nome} onChange={alterar} autoComplete="off" /></Campo>
            <Campo titulo="Login *" ajuda="Letras, números, ponto, traço e underscore. Sem espaços."><input name="login" maxLength={60} required value={f.login} onChange={alterar} autoComplete="off" autoCapitalize="none" spellCheck={false} /></Campo>
            <Campo titulo="Perfil *"><select name="perfil" value={f.perfil} onChange={alterar}><option value="COLABORADOR">Colaborador</option><option value="GESTOR">Gestor</option></select></Campo>
        </div>{!original && <label className="opcao-marcacao espaco-acima"><input name="ativo" type="checkbox" checked={f.ativo} onChange={alterar} />Usuário ativo</label>}<p className="nota-limite">Colaboradores consultam os módulos permitidos; gestores podem realizar alterações e acessar financeiro e usuários.</p>
            {original && <p className="nota-limite">Situação: {original.ativo ? "ativo" : "inativo"}. Ativação e desativação são feitas na listagem. O sistema deve manter ao menos um gestor ativo.</p>}
            {original?.codUsuario === usuarioAtual?.codUsuario && <p className="mensagem-aviso">Você está editando sua própria conta. A mudança para colaborador remove seu acesso a usuários e financeiro.</p>}
            {mudouPerfil && <label className="opcao-marcacao"><input name="confirmarPerfil" type="checkbox" required checked={confirmarPerfil} onChange={e => setConfirmarPerfil(e.target.checked)} />Confirmo a alteração de perfil e suas permissões.</label>}
        </fieldset>
        {!original && <fieldset disabled={gravacao.salvando}><legend>Senha de acesso</legend><div className="grade-formulario">
            <Campo titulo="Senha *" ajuda="Pelo menos 8 caracteres e no máximo 72 bytes. Espaços são preservados."><input name="senha" type={mostrar ? "text" : "password"} required autoComplete="new-password" value={f.senha} onChange={alterar} /></Campo>
            <Campo titulo="Confirmar senha *"><input name="confirmacao" type={mostrar ? "text" : "password"} required autoComplete="new-password" value={f.confirmacao} onChange={alterar} /></Campo>
        </div><label className="opcao-marcacao espaco-acima"><input type="checkbox" checked={mostrar} onChange={e => setMostrar(e.target.checked)} />Mostrar senhas</label></fieldset>}
        <div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : original ? "Salvar usuário" : "Cadastrar usuário"}</button>{!gravacao.salvando && <a className="botao-secundario" href="#/usuarios">Cancelar</a>}</div>
    </form>;
}
// Carregar os dados para cadastrar ou editar o usuário
export default function UsuarioFormulario({ codigo, usuarioAtual, onAtualizado }) {
    const consulta = useConsulta(useCallback(signal => codigo ? service.buscar(codigo, signal) : Promise.resolve(null), [codigo]));
    return <main className="conteudo-dashboard"><CabecalhoModulo titulo={codigo ? "Editar usuário" : "Cadastrar usuário"} descricao="Defina o acesso de uma pessoa à gestão da propriedade." /><EstadoConsulta consulta={consulta} />{!consulta.carregando && !consulta.erro && <FormularioUsuario original={consulta.dados} usuarioAtual={usuarioAtual} onAtualizado={onAtualizado} />}</main>;
}
