import "../styles/financeiro.css";
import { useCallback, useEffect, useRef, useState } from "react";
import service from "../services/financeiro.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import Abas from "../components/AbasFinanceiro.jsx";
import "../styles/novo-tipo-financeiro.css";
import { prepararCatalogo } from "../utils/leiteFinanceiro.js";

const chaves = { fornecedores: "codFornecedor", "tipos-custo": "codTipoCusto", "tipos-receita": "codTipoReceita" };
const titulos = { fornecedores: "Fornecedores", "tipos-custo": "Tipos de custo", "tipos-receita": "Tipos de receita" };
// Listar e permitir editar os tipos e fornecedores do financeiro
export default function CatalogoFinanceiro({ tipo, emJanela = false, onFechar, onAlterado }) {
    const dialogo = useRef(null);
    const [f, setF] = useState({ nome: "", contato: "" });
    const [edicao, setEdicao] = useState(null);
    const [exclusao, setExclusao] = useState(null);
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const gravacao = useGravacao();
    useEffect(() => {
        if (!emJanela) return;
        const elemento = dialogo.current;
        elemento.showModal();
        return () => elemento.close();
    }, [emJanela]);
    const consulta = useConsulta(useCallback(signal => service.listar(tipo, filtro ? { busca: filtro } : {}, signal), [tipo, filtro]));
    // Limpar os campos e voltar ao estado inicial do formulário
    function limpar() { setEdicao(null); setExclusao(null); setF({ nome: "", contato: "" }); }
    // Atualizar a tela depois que o cadastro é salvo
    function sucesso() { limpar(); setMensagem("Operação realizada com sucesso."); consulta.recarregar(); }
    // Conferir os campos e enviar o cadastro
    function salvar(e) { e.preventDefault(); let dados; try { dados = prepararCatalogo(tipo, f); } catch (falha) { gravacao.setErro(falha.message); return; } setMensagem(""); gravacao.executar(() => edicao ? service.atualizar(tipo, edicao[chaves[tipo]], dados) : service.criar(tipo, dados), registro => {
        onAlterado?.({ acao: "salvar", registro });
        sucesso();
    }); }
    const Elemento = emJanela ? "dialog" : "main";
    return <Elemento ref={emJanela ? dialogo : undefined} className={emJanela ? "dialogo-tipo-financeiro gerenciar-tipos-financeiro pagina-financeiro" : "conteudo-dashboard pagina-financeiro"}
        aria-label={emJanela ? titulos[tipo] : undefined}
        onCancel={emJanela ? e => { e.preventDefault(); if (!gravacao.salvando) onFechar(); } : undefined}>
        <CabecalhoModulo titulo={titulos[tipo]} descricao="Organize os cadastros utilizados nos lançamentos financeiros.">
            {emJanela && <button type="button" className="botao-secundario" disabled={gravacao.salvando} onClick={onFechar}>Fechar gerenciamento</button>}
        </CabecalhoModulo>{!emJanela && <Abas tipo={tipo} />}
        {gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}{mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
        <form className="painel formulario-modulo" onSubmit={salvar}><fieldset disabled={gravacao.salvando}><legend>{edicao ? "Editar cadastro" : "Novo cadastro"}</legend><div className="grade-formulario"><Campo titulo="Nome *"><input required maxLength={tipo === "fornecedores" ? 150 : 100} value={f.nome} onChange={e => setF(v => ({ ...v, nome: e.target.value }))} /></Campo>{tipo === "fornecedores" && <Campo titulo="Contato"><input maxLength={150} value={f.contato} onChange={e => setF(v => ({ ...v, contato: e.target.value }))} /></Campo>}</div></fieldset><div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : "Salvar cadastro"}</button>{edicao && <button type="button" className="botao-secundario" disabled={gravacao.salvando} onClick={limpar}>Cancelar edição</button>}</div></form>
        <form className="painel filtros-modulo espaco-acima" onSubmit={e => { e.preventDefault(); if (filtro === busca) consulta.recarregar(); else setFiltro(busca); }}><Campo titulo="Buscar por nome"><input maxLength={150} value={busca} onChange={e => setBusca(e.target.value)} /></Campo><button className="botao-secundario" disabled={consulta.carregando}>Buscar</button></form>
        {exclusao && <section className="painel confirmar-exclusao"><h2>Excluir {exclusao.nome}?</h2><p>Cadastros vinculados a lançamentos não podem ser excluídos.</p><div className="acoes-modulo"><button className="botao-perigo" disabled={gravacao.salvando} onClick={() => gravacao.executar(() => service.excluir(tipo, exclusao[chaves[tipo]]), () => {
            onAlterado?.({ acao: "excluir", registro: exclusao });
            sucesso();
        })}>Confirmar exclusão</button><button className="botao-secundario" disabled={gravacao.salvando} onClick={() => setExclusao(null)}>Cancelar</button></div></section>}
        <EstadoConsulta consulta={consulta} />{consulta.dados && <section className="painel"><p>{consulta.dados.length} registros encontrados</p>{consulta.dados.length ? <div className="tabela-rolagem" role="region" tabIndex="0" aria-label="Tabela com rolagem horizontal"><table className="tabela-modulo"><thead><tr><th>Nome</th>{tipo === "fornecedores" && <th>Contato</th>}<th>Ações</th></tr></thead><tbody>{consulta.dados.map(r => <tr key={r[chaves[tipo]]}><th scope="row">{r.nome}</th>{tipo === "fornecedores" && <td>{r.contato || "Não informado"}</td>}<td className="acoes-tabela"><button className="botao-texto" disabled={gravacao.salvando} onClick={() => { setEdicao(r); setExclusao(null); setF({ nome: r.nome, contato: r.contato || "" }); gravacao.setErro(""); setMensagem(""); }}>Editar</button><button className="botao-texto" disabled={gravacao.salvando} onClick={() => { setExclusao(r); gravacao.setErro(""); setMensagem(""); }}>Excluir</button></td></tr>)}</tbody></table></div> : <p>Nenhum cadastro encontrado.</p>}</section>}
    </Elemento>;
}
