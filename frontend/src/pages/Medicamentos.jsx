import "../styles/atividades.css";
import { useCallback, useEffect, useRef, useState } from "react";
import service from "../services/medicamento.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";

// Listar e permitir cadastrar ou editar medicamentos
export default function Medicamentos({ gestor, emJanela = false, onFechar, onAlterado }) {
    const dialogo = useRef(null);
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState("");
    const [edicao, setEdicao] = useState(null);
    const [exclusao, setExclusao] = useState(null);
    const [formulario, setFormulario] = useState({ nome: "", descricao: "" });
    const [mensagem, setMensagem] = useState("");
    const consulta = useConsulta(useCallback(signal => service.listar(filtro, signal), [filtro]));
    const gravacao = useGravacao();
    useEffect(() => {
        if (!emJanela) return;
        const elemento = dialogo.current;
        elemento.showModal();
        return () => elemento.close();
    }, [emJanela]);
    // Limpar os campos e voltar ao estado inicial do formulário
    function limpar() { setEdicao(null); setExclusao(null); setFormulario({ nome: "", descricao: "" }); }
    // Atualizar a tela depois que o cadastro é salvo
    function sucesso(texto) { limpar(); setMensagem(texto); consulta.recarregar(); }
    // Conferir os campos e enviar o cadastro
    function salvar(e) {
        e.preventDefault();
        const nome = formulario.nome.trim();
        if (!nome) { gravacao.setErro("Informe o nome do medicamento."); return; }
        const dados = { nome, descricao: formulario.descricao.trim() || null };
        gravacao.executar(() => edicao ? service.atualizar(edicao.codMedicamento, dados) : service.criar(dados), medicamento => {
            onAlterado?.({ tipo: "salvar", medicamento });
            sucesso("Medicamento salvo com sucesso.");
        });
    }
    const Elemento = emJanela ? "dialog" : "main";
    return <Elemento ref={emJanela ? dialogo : undefined} className={emJanela ? "dialogo-medicamento gerenciar-medicamentos pagina-atividades" : "conteudo-dashboard pagina-atividades"}
        aria-label={emJanela ? "Gerenciar medicamentos" : undefined}
        onCancel={emJanela ? e => { e.preventDefault(); if (!gravacao.salvando) onFechar(); } : undefined}>
        <CabecalhoModulo titulo="Medicamentos" descricao="Cadastre os produtos utilizados nas atividades e tratamentos do rebanho.">
            {emJanela && <button type="button" className="botao-secundario" disabled={gravacao.salvando} onClick={onFechar}>Fechar gerenciamento</button>}
        </CabecalhoModulo>
        {gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}{mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
        {gestor && <form className="painel formulario-modulo" onSubmit={salvar} aria-busy={gravacao.salvando}>
            <fieldset disabled={gravacao.salvando}><legend>{edicao ? "Editar medicamento" : "Cadastrar medicamento"}</legend><div className="grade-formulario">
                <Campo titulo="Nome *"><input name="nome" required maxLength={150} value={formulario.nome} onChange={e => setFormulario(f => ({ ...f, nome: e.target.value }))} /></Campo>
                <Campo titulo="Descrição"><textarea name="descricao" rows={3} value={formulario.descricao} onChange={e => setFormulario(f => ({ ...f, descricao: e.target.value }))} /></Campo>
            </div></fieldset><div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : "Salvar medicamento"}</button>
                {edicao && <button type="button" className="botao-secundario" disabled={gravacao.salvando} onClick={limpar}>Cancelar edição</button>}</div>
        </form>}
        <form className="painel filtros-modulo espaco-acima" onSubmit={e => { e.preventDefault(); setFiltro(busca); if (busca === filtro) consulta.recarregar(); }}>
            <Campo titulo="Buscar medicamento"><input maxLength={150} value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome do medicamento" /></Campo>
            <button className="botao-secundario" disabled={consulta.carregando}>Buscar</button>
        </form>
        {exclusao && <section className="painel confirmar-exclusao"><h2>Excluir {exclusao.nome}?</h2><p>Medicamentos com usos registrados não podem ser excluídos.</p>
            <div className="acoes-modulo"><button className="botao-perigo" disabled={gravacao.salvando} onClick={() => gravacao.executar(() => service.excluir(exclusao.codMedicamento), () => {
                onAlterado?.({ tipo: "excluir", medicamento: exclusao });
                sucesso("Medicamento excluído.");
            })}>Confirmar exclusão</button>
                <button className="botao-secundario" disabled={gravacao.salvando} onClick={() => setExclusao(null)}>Cancelar</button></div></section>}
        <EstadoConsulta consulta={consulta} />{consulta.dados && <section className="painel"><p className="resumo-listagem">{consulta.dados.length} medicamentos encontrados</p>
            {consulta.dados.length ? <div className="tabela-rolagem" role="region" tabIndex="0" aria-label="Tabela com rolagem horizontal"><table className="tabela-modulo"><thead><tr><th scope="col">Medicamento</th><th scope="col">Descrição</th>{gestor && <th scope="col">Ações</th>}</tr></thead>
                <tbody>{consulta.dados.map(m => <tr key={m.codMedicamento}><th scope="row">{m.nome}</th><td className="texto-longo">{m.descricao || "Não informada"}</td>{gestor && <td className="acoes-tabela">
                    <button className="botao-texto" disabled={gravacao.salvando} onClick={() => { setEdicao(m); setExclusao(null); setFormulario({ nome: m.nome, descricao: m.descricao || "" }); gravacao.setErro(""); setMensagem(""); }}>Editar<span className="somente-leitor"> {m.nome}</span></button>
                    <button className="botao-texto" disabled={gravacao.salvando} onClick={() => { setExclusao(m); gravacao.setErro(""); setMensagem(""); }}>Excluir<span className="somente-leitor"> {m.nome}</span></button>
                </td>}</tr>)}</tbody></table></div> : <p className="texto-vazio">Nenhum medicamento encontrado.</p>}
        </section>}
    </Elemento>;
}
