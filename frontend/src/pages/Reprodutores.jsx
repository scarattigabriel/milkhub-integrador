import "../styles/reproducao.css";
import { useCallback, useState } from "react";
import service from "../services/reprodutor.service.js";
import racaService from "../services/raca.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { prepararReprodutor } from "../utils/reproducao.js";

// Preparar um formulário sem dados preenchidos
const vazio = () => ({ nome: "", numeroRegistro: "", codRaca: "" });
// Listar e permitir cadastrar ou editar os reprodutores
export default function Reprodutores({ gestor }) {
    const [formulario, setFormulario] = useState(vazio);
    const [edicao, setEdicao] = useState(null);
    const [exclusao, setExclusao] = useState(null);
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const gravacao = useGravacao();
    const consulta = useConsulta(useCallback(async signal => {
        const [registros, racas] = await Promise.all([service.listar(filtro ? { busca: filtro } : {}, signal), racaService.listar(signal)]);
        return { registros, racas };
    }, [filtro]));
    // Atualizar o campo preenchido no formulário
    const alterar = e => setFormulario(f => ({ ...f, [e.target.name]: e.target.value }));
    // Limpar os campos e voltar ao estado inicial do formulário
    function limpar() { setEdicao(null); setExclusao(null); setFormulario(vazio()); }
    // Atualizar a tela depois que o cadastro é salvo
    function sucesso() { limpar(); setMensagem("Operação realizada com sucesso."); consulta.recarregar(); }
    // Conferir os campos e enviar o cadastro
    function salvar(e) {
        e.preventDefault(); let dados;
        try { dados = prepararReprodutor(formulario); } catch (falha) { gravacao.setErro(falha.message); return; }
        setMensagem(""); gravacao.executar(() => edicao ? service.atualizar(edicao.codReprodutor, dados) : service.criar(dados), sucesso);
    }
    return <main className="conteudo-dashboard pagina-reproducao"><CabecalhoModulo titulo="Reprodutores" descricao="Mantenha o cadastro dos reprodutores utilizados nas inseminações."><a href="#/reproducao" className="botao-secundario">Controle reprodutivo</a></CabecalhoModulo>
        {gravacao.erro && <p role="alert" className="mensagem-erro">{gravacao.erro}</p>}{mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
        {gestor && <form className="painel formulario-modulo" onSubmit={salvar}><fieldset disabled={gravacao.salvando}><legend>{edicao ? "Editar reprodutor" : "Cadastrar reprodutor"}</legend><div className="grade-formulario">
            <Campo titulo="Nome *"><input name="nome" required maxLength={150} value={formulario.nome} onChange={alterar} /></Campo>
            <Campo titulo="Número de registro"><input name="numeroRegistro" maxLength={60} value={formulario.numeroRegistro} onChange={alterar} /></Campo>
            <Campo titulo="Raça"><select name="codRaca" value={formulario.codRaca ?? ""} onChange={alterar}><option value="">Não informada</option>{consulta.dados?.racas.map(r => <option key={r.codRaca} value={r.codRaca}>{r.nome}</option>)}</select></Campo>
        </div></fieldset><div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : "Salvar reprodutor"}</button>{edicao && <button className="botao-secundario" type="button" disabled={gravacao.salvando} onClick={limpar}>Cancelar edição</button>}</div></form>}
        <form className="painel filtros-modulo espaco-acima" onSubmit={e => { e.preventDefault(); if (busca === filtro) consulta.recarregar(); else setFiltro(busca); }}><Campo titulo="Busca por nome ou registro"><input maxLength={150} value={busca} onChange={e => setBusca(e.target.value)} /></Campo><button className="botao-secundario" disabled={consulta.carregando}>Buscar</button></form>
        {exclusao && <section className="painel confirmar-exclusao"><h2>Excluir {exclusao.nome}?</h2><p>Reprodutores com inseminações vinculadas não podem ser excluídos.</p><div className="acoes-modulo"><button className="botao-perigo" disabled={gravacao.salvando} onClick={() => gravacao.executar(() => service.excluir(exclusao.codReprodutor), sucesso)}>Confirmar exclusão</button><button className="botao-secundario" disabled={gravacao.salvando} onClick={() => setExclusao(null)}>Cancelar</button></div></section>}
        <EstadoConsulta consulta={consulta} />{consulta.dados && <section className="painel"><p className="resumo-listagem">{consulta.dados.registros.length} reprodutores encontrados</p>{consulta.dados.registros.length ? <div className="tabela-rolagem" role="region" tabIndex="0" aria-label="Tabela com rolagem horizontal"><table className="tabela-modulo"><thead><tr><th>Nome</th><th>Registro</th><th>Raça</th>{gestor && <th>Ações</th>}</tr></thead><tbody>{consulta.dados.registros.map(r => <tr key={r.codReprodutor}><th scope="row">{r.nome}</th><td>{r.numeroRegistro || "Não informado"}</td><td>{r.raca?.nome || "Não informada"}</td>{gestor && <td className="acoes-tabela"><button className="botao-texto" disabled={gravacao.salvando} onClick={() => { setEdicao(r); setFormulario({ nome: r.nome, numeroRegistro: r.numeroRegistro || "", codRaca: r.codRaca || "" }); setExclusao(null); gravacao.setErro(""); setMensagem(""); }}>Editar</button><button className="botao-texto" disabled={gravacao.salvando} onClick={() => { setExclusao(r); gravacao.setErro(""); setMensagem(""); }}>Excluir</button></td>}</tr>)}</tbody></table></div> : <p>Nenhum reprodutor encontrado.</p>}</section>}
    </main>;
}
