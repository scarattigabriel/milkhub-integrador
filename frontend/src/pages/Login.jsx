import { useRef, useState } from "react";
import logoMilkHub from "../assets/milkhub-logo.png";
import obterMensagemErro from "../utils/obterMensagemErro.js";
import "../styles/login.css";

// Mostrar o formulário e permitir entrar no sistema
function Login({ onEntrar, aviso }) {
    const [login, setLogin] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");
    const enviandoRef = useRef(false);
    const loginRef = useRef(null);
    const senhaRef = useRef(null);

    // Enviar os dados e mostrar se houve algum erro
    async function enviar(evento) {
        evento.preventDefault();
        if (enviandoRef.current) return;
        setErro("");

        if (!/^[a-zA-Z0-9._-]{1,60}$/.test(login.trim())) {
            setErro("Informe um login de até 60 caracteres, usando letras, números, ponto, traço ou underscore.");
            loginRef.current.focus();
            return;
        }
        if (!senha.trim() || new TextEncoder().encode(senha).length > 72) {
            setErro("Informe sua senha, respeitando o limite de 72 bytes.");
            senhaRef.current.focus();
            return;
        }

        enviandoRef.current = true;
        setEnviando(true);
        try {

            await onEntrar({ login, senha });
        } catch (falha) {
            setErro(obterMensagemErro(falha));
        } finally {
            enviandoRef.current = false;
            setEnviando(false);
        }
    }

    return (
        <main className="pagina-login">
            <section className="apresentacao-login" aria-labelledby="titulo-apresentacao">
                <img className="logo-login" src={logoMilkHub} alt="MilkHub" width="2160" height="720" />
                <div className="texto-apresentacao">
                    <h1 id="titulo-apresentacao">Mais organização.<br />Mais cuidado em cada dia.</h1>
                    <p>O rebanho, a produção e a rotina da sua propriedade em um só lugar.</p>
                </div>
            </section>

            <section className="area-formulario" aria-labelledby="titulo-login">
                <div className="cartao-login">
                    <span className="legenda-login">BEM-VINDO DE VOLTA</span>
                    <h2 id="titulo-login">Acesse sua conta</h2>
                    <p className="descricao-login">Entre com seu login e senha para continuar.</p>

                    {aviso && !erro && <p className="mensagem-aviso" role="status">{aviso}</p>}
                    {erro && <p id="erro-login" className="mensagem-erro" role="alert">{erro}</p>}

                    <form onSubmit={enviar} aria-busy={enviando} aria-describedby={erro ? "erro-login" : undefined}>
                        <div className="campo-formulario">
                            <label htmlFor="login">Login</label>
                            <input ref={loginRef} id="login" name="login" type="text" autoComplete="username"
                                autoCapitalize="none" spellCheck={false} maxLength={60} required
                                placeholder="Digite seu login" value={login} disabled={enviando}
                                onChange={evento => setLogin(evento.target.value)} />
                        </div>

                        <div className="campo-formulario">
                            <label htmlFor="senha">Senha</label>
                            <div className="campo-senha">
                                <input ref={senhaRef} id="senha" name="senha" type={mostrarSenha ? "text" : "password"}
                                    autoComplete="current-password" required placeholder="Digite sua senha"
                                    value={senha} disabled={enviando} onChange={evento => setSenha(evento.target.value)} />
                                <button type="button" className="alternar-senha" aria-controls="senha" aria-pressed={mostrarSenha}
                                    disabled={enviando} onClick={() => setMostrarSenha(valor => !valor)}>
                                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>
                        </div>

                        <button className="botao-primario" type="submit" disabled={enviando}>
                            {enviando ? "Entrando…" : "Entrar"}
                        </button>
                    </form>
                    <p className="ajuda-login">Precisa de acesso? Solicite seu cadastro ao gestor da propriedade.</p>
                </div>
            </section>
        </main>
    );
}

export default Login;
