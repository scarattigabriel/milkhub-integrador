import { useCallback, useState } from "react";
import service from "../services/usuario.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { prepararSenha, perdeAcessoGestao } from "../utils/usuario.js";

// Mostrar os campos da nova senha e sua confirmação
export function FormularioSenhaUsuario({ original, usuarioAtual, onAtualizado }) {
    const [f, setF] = useState({ senha: "", confirmacao: "" });
    const [mostrar, setMostrar] = useState(false);
    const gravacao = useGravacao();
    // Conferir os campos e enviar o cadastro
    function salvar(e) { e.preventDefault(); let dados; try { dados = prepararSenha(f); } catch (falha) { gravacao.setErro(falha.message); return; }
        gravacao.executar(() => service.atualizar(original.codUsuario, dados), u => { setF({ senha: "", confirmacao: "" }); onAtualizado?.(u); navegar(perdeAcessoGestao(usuarioAtual, u) ? "/dashboard" : "/usuarios"); }); }
    return <form className="painel formulario-modulo" onSubmit={salvar} aria-busy={gravacao.salvando}><p>Conta: <strong>{original.nome}</strong> · {original.login}</p><p className="nota-limite">A senha atual não é exibida. A nova senha passa a valer para os próximos logins.</p>
        {gravacao.erro && <p role="alert" className="mensagem-erro">{gravacao.erro}</p>}<fieldset disabled={gravacao.salvando}><legend>Nova senha</legend><div className="grade-formulario"><Campo titulo="Nova senha *" ajuda="Pelo menos 8 caracteres e no máximo 72 bytes."><input name="senha" type={mostrar ? "text" : "password"} required autoComplete="new-password" value={f.senha} onChange={e => setF(v => ({ ...v, senha: e.target.value }))} /></Campo><Campo titulo="Confirmar nova senha *"><input name="confirmacao" type={mostrar ? "text" : "password"} required autoComplete="new-password" value={f.confirmacao} onChange={e => setF(v => ({ ...v, confirmacao: e.target.value }))} /></Campo></div><label className="opcao-marcacao espaco-acima"><input type="checkbox" checked={mostrar} onChange={e => setMostrar(e.target.checked)} />Mostrar senhas</label></fieldset><div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : "Alterar senha"}</button>{!gravacao.salvando && <a className="botao-secundario" href="#/usuarios">Cancelar</a>}</div>
    </form>;
}
// Carregar a conta que terá a senha alterada
export default function UsuarioSenha({ codigo, usuarioAtual, onAtualizado }) {
    const consulta = useConsulta(useCallback(signal => service.buscar(codigo, signal), [codigo]));
    return <main className="conteudo-dashboard"><CabecalhoModulo titulo="Alterar senha de usuário" descricao="Defina uma nova senha para a conta selecionada." /><EstadoConsulta consulta={consulta} />{consulta.dados && <FormularioSenhaUsuario original={consulta.dados} usuarioAtual={usuarioAtual} onAtualizado={onAtualizado} />}</main>;
}
