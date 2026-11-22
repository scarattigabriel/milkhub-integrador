import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import useAutenticacao from "./hooks/useAutenticacao.js";
import useRota from "./hooks/useRota.js";
import Layout from "./components/Layout.jsx";
import Animais from "./pages/Animais.jsx";
import AnimalFormulario from "./pages/AnimalFormulario.jsx";
import AnimalDetalhe from "./pages/AnimalDetalhe.jsx";
import AnimalSaida from "./pages/AnimalSaida.jsx";
import Medicamentos from "./pages/Medicamentos.jsx";
import Atividades from "./pages/Atividades.jsx";
import AtividadeFormulario from "./pages/AtividadeFormulario.jsx";
import AtividadeDetalhe from "./pages/AtividadeDetalhe.jsx";
import AtividadeConclusao from "./pages/AtividadeConclusao.jsx";
import Carencias from "./pages/Carencias.jsx";
import Reprodutores from "./pages/Reprodutores.jsx";
import Reproducao from "./pages/Reproducao.jsx";
import InseminacaoFormulario from "./pages/InseminacaoFormulario.jsx";
import InseminacaoDetalhe from "./pages/InseminacaoDetalhe.jsx";
import DiagnosticoFormulario from "./pages/DiagnosticoFormulario.jsx";
import GestacaoFormulario from "./pages/GestacaoFormulario.jsx";
import GestacaoDetalhe from "./pages/GestacaoDetalhe.jsx";
import EventoReprodutivo from "./pages/EventoReprodutivo.jsx";
import Leite from "./pages/Leite.jsx";
import ColetaFormulario from "./pages/ColetaFormulario.jsx";
import FechamentoLeite from "./pages/FechamentoLeite.jsx";
import FinanceiroLista from "./pages/FinanceiroLista.jsx";
import CatalogoFinanceiro from "./pages/CatalogoFinanceiro.jsx";
import LancamentoFormulario from "./pages/LancamentoFormulario.jsx";
import LancamentoDetalhe from "./pages/LancamentoDetalhe.jsx";
import FinanceiroResumo from "./pages/FinanceiroResumo.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import UsuarioFormulario from "./pages/UsuarioFormulario.jsx";
import UsuarioSenha from "./pages/UsuarioSenha.jsx";

// Escolher a tela e conferir o acesso do usuário
function App() {
    const auth = useAutenticacao();
    const rota = useRota();

    if (auth.carregando) return <main className="estado-sessao" role="status">Verificando sua sessão…</main>;

    if (auth.erroSessao) return (
        <main className="estado-sessao">
            <h1>Não foi possível verificar sua sessão</h1>
            <p role="alert">{auth.erroSessao}</p>
            <button className="botao-primario" onClick={auth.tentarNovamente}>Tentar novamente</button>
            <button className="botao-secundario" onClick={auth.sair}>Voltar ao login</button>
        </main>
    );

    if (!auth.usuario) return <Login onEntrar={auth.entrar} aviso={auth.aviso} />;

    const gestor = auth.usuario.perfil === "GESTOR";
    let tela;
    if (rota.gestor && !gestor) tela = <main className="conteudo-dashboard"><h1>Acesso restrito</h1><p>Esta operação é permitida somente ao gestor.</p><a href="#/animais">Voltar aos animais</a></main>;
    else switch (rota.pagina) {
        case "dashboard": tela = <Dashboard usuario={auth.usuario} />; break;
        case "animais": tela = <Animais gestor={gestor} />; break;
        case "animal-form": tela = <AnimalFormulario codigo={rota.codigo} />; break;
        case "animal-detalhe": tela = <AnimalDetalhe codigo={rota.codigo} gestor={gestor} />; break;
        case "animal-saida": tela = <AnimalSaida codigo={rota.codigo} />; break;
        case "medicamentos": tela = <Medicamentos gestor={gestor} />; break;
        case "atividades": tela = <Atividades gestor={gestor} />; break;
        case "atividade-form": tela = <AtividadeFormulario codigo={rota.codigo} />; break;
        case "atividade-detalhe": tela = <AtividadeDetalhe codigo={rota.codigo} gestor={gestor} />; break;
        case "atividade-conclusao": tela = <AtividadeConclusao codigo={rota.codigo} />; break;
        case "carencias": tela = <Carencias codigo={rota.codigo} />; break;
        case "reprodutores": tela = <Reprodutores gestor={gestor} />; break;
        case "reproducao": tela = <Reproducao gestor={gestor} tipo={rota.tipo} />; break;
        case "repro-diagnostico-form": tela = <DiagnosticoFormulario origem={rota.origem} />; break;
        case "repro-gestacao-form": tela = <GestacaoFormulario codigo={rota.codigo} />; break;
        case "repro-gestacao-detalhe": tela = <GestacaoDetalhe codigo={rota.codigo} gestor={gestor} />; break;
        case "repro-evento-form": tela = <EventoReprodutivo tipo={rota.tipo} origem={rota.origem} />; break;
        case "leite": tela = <Leite gestor={gestor} referencia={rota.referencia} />; break;
        case "leite-coleta-form": tela = <ColetaFormulario codigo={rota.codigo} />; break;
        case "leite-fechamento": tela = <FechamentoLeite codigo={rota.codigo} gestor={gestor} />; break;
        case "financeiro-lista": tela = <FinanceiroLista tipo={rota.tipo} referencia={rota.referencia} />; break;
        case "financeiro-catalogo": tela = <CatalogoFinanceiro tipo={rota.tipo} />; break;
        case "financeiro-form": tela = <LancamentoFormulario tipo={rota.tipo} codigo={rota.codigo} />; break;
        case "financeiro-detalhe": tela = <LancamentoDetalhe tipo={rota.tipo} codigo={rota.codigo} />; break;
        case "financeiro-resumo": tela = <FinanceiroResumo />; break;
        case "usuarios": tela = <Usuarios usuarioAtual={auth.usuario} onAtualizado={auth.atualizarUsuarioAtual} />; break;
        case "usuario-form": tela = <UsuarioFormulario codigo={rota.codigo} usuarioAtual={auth.usuario} onAtualizado={auth.atualizarUsuarioAtual} />; break;
        case "usuario-senha": tela = <UsuarioSenha codigo={rota.codigo} usuarioAtual={auth.usuario} onAtualizado={auth.atualizarUsuarioAtual} />; break;
        case "inseminacao-form": tela = <InseminacaoFormulario />; break;
        case "inseminacao-detalhe": tela = <InseminacaoDetalhe codigo={rota.codigo} gestor={gestor} />; break;
        default: tela = <main className="conteudo-dashboard"><h1>Página não encontrada</h1><a href="#/dashboard">Ir para o dashboard</a></main>;
    }
    return <Layout usuario={auth.usuario} onSair={auth.sair} pagina={rota.pagina} rota={rota.chave}>
        <div key={rota.chave}>{tela}</div>
    </Layout>;
}

export default App;
