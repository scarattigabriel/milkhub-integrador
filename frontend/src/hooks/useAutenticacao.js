import { useEffect, useState } from "react";
import axios from "axios";
import api from "../services/api.js";
import authService from "../services/auth.service.js";
import { obterToken, removerToken, salvarToken } from "../utils/sessao.js";
import obterMensagemErro from "../utils/obterMensagemErro.js";

// Cuidar da sessão e dos dados do usuário conectado
function useAutenticacao() {
    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erroSessao, setErroSessao] = useState("");
    const [aviso, setAviso] = useState("");
    const [tentativa, setTentativa] = useState(0);

    // Apagar a sessão local e voltar para o login
    function sair() {
        removerToken();
        setUsuario(null);
        setErroSessao("");
        setAviso("");
    }

    useEffect(() => {
        const controller = new AbortController();
        const interceptor = api.interceptors.response.use(resposta => resposta, erro => {

            const token = obterToken();
            if (erro.response?.status === 401 && token &&
                erro.config?.headers?.get("Authorization") === `Bearer ${token}`) {
                removerToken();
                setUsuario(null);
                setErroSessao("");
                setAviso("Sua sessão terminou. Entre novamente para continuar.");
            }
            return Promise.reject(erro);
        });

        // Conferir o token salvo e tentar recuperar a sessão
        async function restaurar() {
            setCarregando(true);
            setErroSessao("");
            try {
                if (obterToken()) {
                    const dados = await authService.me(controller.signal);
                    if (!controller.signal.aborted) setUsuario(dados);
                }
            } catch (erro) {

                if (!controller.signal.aborted && !axios.isCancel(erro) && erro.response?.status !== 401) {
                    setErroSessao(obterMensagemErro(erro));
                }
            } finally {
                if (!controller.signal.aborted) setCarregando(false);
            }
        }

        restaurar();
        return () => {
            controller.abort();
            api.interceptors.response.eject(interceptor);
        };
    }, [tentativa]);

    // Fazer o login e guardar a sessão recebida
    async function entrar(dados) {
        const resultado = await authService.login(dados);
        salvarToken(resultado.token);
        setUsuario(resultado.usuario);
        setAviso("");
    }

    // Atualizar os dados da conta que está conectada
    function atualizarUsuarioAtual(atualizado) {
        if (Number(usuario?.codUsuario) !== Number(atualizado.codUsuario)) return;
        if (!atualizado.ativo) {
            sair();
            setAviso("Sua conta foi desativada. Para voltar a acessar, solicite a ativação a outro gestor.");
        } else {
            setUsuario({ codUsuario: atualizado.codUsuario, nome: atualizado.nome, login: atualizado.login,
                ativo: atualizado.ativo, perfil: atualizado.perfil });
        }
    }

    return { usuario, carregando, erroSessao, aviso, entrar, sair, atualizarUsuarioAtual,
        // Tentar recuperar a sessão de novo
        tentarNovamente: () => setTentativa(valor => valor + 1) };
}

export default useAutenticacao;
