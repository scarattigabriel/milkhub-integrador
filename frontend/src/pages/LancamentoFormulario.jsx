import "../styles/financeiro.css";
import { useCallback, useState } from "react";
import service from "../services/financeiro.service.js";
import leiteService from "../services/leite.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { filtrosIniciais, moeda } from "../utils/formatacao.js";
import NovoCadastroFinanceiro from "../components/NovoCadastroFinanceiro.jsx";
import CatalogoFinanceiro from "./CatalogoFinanceiro.jsx";
import { prepararLancamento, rotaPeriodo } from "../utils/leiteFinanceiro.js";

// Mostrar os campos de custo ou receita e os cadastros vinculados
export function FormularioLancamento({ tipo, original = null, tipos, fornecedores = [], fechamentos = [] }) {
    const custo = tipo === "custos";
    const [f, setF] = useState({ descricao: original?.descricao || "", data: (custo ? original?.dataCusto : original?.dataReceita) || filtrosIniciais().dataAgenda,
        valor: original?.valor ?? "", codTipo: (custo ? original?.codTipoCusto : original?.codTipoReceita) || "", codFornecedor: original?.codFornecedor || "", codFechamento: original?.codFechamento || "" });
    const chaveTipo = custo ? "codTipoCusto" : "codTipoReceita";
    const [tiposDisponiveis, setTiposDisponiveis] = useState(tipos);
    const [gerenciandoTipos, setGerenciandoTipos] = useState(false);
    const [catalogoAberto, setCatalogoAberto] = useState(null);
    const [novosFornecedores, setNovosFornecedores] = useState([]);
    const fornecedoresDisponiveis = [...fornecedores, ...novosFornecedores.filter(n => !fornecedores.some(v => v.codFornecedor === n.codFornecedor))];
    const gravacao = useGravacao();
    // Atualizar o campo preenchido no formulário
    const alterar = e => setF(v => ({ ...v, [e.target.name]: e.target.value }));
    const vinculado = !custo && Boolean(original?.codFechamento || (!original && f.codFechamento));
    const fechamento = fechamentos.find(v => String(v.codFechamento) === String(f.codFechamento));
    // Atualizar os tipos sem apagar os dados já preenchidos no lançamento
    function atualizarTipos({ acao, registro }) {
        setTiposDisponiveis(atuais => {
            const restantes = atuais.filter(t => t[chaveTipo] !== registro[chaveTipo]);
            return acao === "excluir" ? restantes : [...restantes, registro];
        });
        if (acao === "excluir") setF(atual => String(atual.codTipo) === String(registro[chaveTipo]) ? { ...atual, codTipo: "" } : atual);
    }
    // Conferir os campos e enviar o cadastro
    function salvar(e) { e.preventDefault(); let dados; try { dados = prepararLancamento(tipo, f, original); } catch (falha) { gravacao.setErro(falha.message); return; }
        gravacao.executar(() => original ? service.atualizar(tipo, original[custo ? "codCusto" : "codReceita"], dados) : service.criar(tipo, dados), r => navegar(rotaPeriodo(`/financeiro/${tipo}`, custo ? r.dataCusto : r.dataReceita))); }
    return <><form className="painel formulario-modulo" onSubmit={salvar}>{gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}<fieldset disabled={gravacao.salvando}><legend>Dados do lançamento</legend><div className="grade-formulario">
        <Campo titulo="Descrição *"><input name="descricao" required maxLength={255} value={f.descricao} onChange={alterar} /></Campo>
        <Campo titulo={custo ? "Data do custo *" : "Data do recebimento *"}><input name="data" type="date" required min="0001-01-01" max={filtrosIniciais().dataAgenda} value={f.data} onChange={alterar} /></Campo>
        <div className="seletor-tipo-financeiro"><Campo titulo="Tipo *"><select name="codTipo" required value={f.codTipo} onChange={alterar}><option value="">Selecione</option>{tiposDisponiveis.map(t => <option key={t[custo ? "codTipoCusto" : "codTipoReceita"]} value={t[custo ? "codTipoCusto" : "codTipoReceita"]}>{t.nome}</option>)}</select></Campo><button type="button" className="botao-texto criar-tipo-financeiro" onClick={() => setCatalogoAberto(custo ? "tipos-custo" : "tipos-receita")}>Criar novo tipo de {custo ? "custo" : "receita"}</button><button type="button" className="botao-secundario botao-gerenciar-tipos" onClick={() => setGerenciandoTipos(true)}>Gerenciar tipos de {custo ? "custo" : "receita"}</button></div>
        {custo && <div className="seletor-tipo-financeiro"><Campo titulo="Fornecedor"><select name="codFornecedor" value={f.codFornecedor} onChange={alterar}><option value="">Não informado</option>{fornecedoresDisponiveis.map(v => <option key={v.codFornecedor} value={v.codFornecedor}>{v.nome}</option>)}</select></Campo><button type="button" className="botao-texto criar-tipo-financeiro criar-fornecedor" onClick={() => setCatalogoAberto("fornecedores")}>Criar novo fornecedor</button></div>}
        {!custo && !original && <Campo titulo="Origem da receita" ajuda="Para recebimento do leite, vincule o fechamento. São mostrados os fechamentos com valor e sem receita vinculada."><select name="codFechamento" value={f.codFechamento} onChange={alterar}><option value="">Receita avulsa</option>{fechamentos.map(v => <option key={v.codFechamento} value={v.codFechamento}>Leite {v.mesReferencia}/{v.anoReferencia} · {moeda(v.valorTotalLeite)}</option>)}</select></Campo>}
        {vinculado ? <Campo titulo="Valor vinculado ao fechamento"><output>{fechamento?.valorTotalLeite != null || original?.valor != null ? moeda(fechamento?.valorTotalLeite ?? original.valor) : "Não informado"}</output><small>Para corrigir o valor, altere o fechamento do leite. O vínculo não pode ser trocado por esta edição.</small></Campo> : <Campo titulo="Valor (R$) *"><input name="valor" inputMode="decimal" required value={f.valor} onChange={alterar} /></Campo>}
    </div></fieldset>{!tiposDisponiveis.length && <p className="mensagem-aviso">Cadastre um tipo de lançamento antes de continuar.</p>}<div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando || !tiposDisponiveis.length}>{gravacao.salvando ? "Salvando…" : "Salvar lançamento"}</button>{!gravacao.salvando && <a className="botao-secundario" href={`#/financeiro/${tipo}`}>Cancelar</a>}</div></form>{gerenciandoTipos && <CatalogoFinanceiro tipo={custo ? "tipos-custo" : "tipos-receita"} emJanela onFechar={() => setGerenciandoTipos(false)} onAlterado={atualizarTipos} />}{catalogoAberto && <NovoCadastroFinanceiro catalogo={catalogoAberto} onFechar={() => setCatalogoAberto(null)} onCriado={novo => { if (catalogoAberto === "fornecedores") { setNovosFornecedores(v => [...v, novo]); setF(v => ({ ...v, codFornecedor: String(novo.codFornecedor) })); } else { setTiposDisponiveis(v => [...v, novo]); setF(v => ({ ...v, codTipo: String(novo[chaveTipo]) })); } setCatalogoAberto(null); }} />}</>;
}
// Carregar os dados para cadastrar ou editar o lançamento
export default function LancamentoFormulario({ tipo, codigo }) {
    const custo = tipo === "custos";
    const consulta = useConsulta(useCallback(async signal => {
        const [original, tipos, fornecedores, fechamentos, receitas] = await Promise.all([codigo ? service.buscar(tipo, codigo, signal) : Promise.resolve(null), service.listar(custo ? "tipos-custo" : "tipos-receita", {}, signal), custo ? service.listar("fornecedores", {}, signal) : Promise.resolve([]), !custo ? leiteService.fechamentos(signal) : Promise.resolve([]), !custo && !codigo ? service.listar("receitas", {}, signal) : Promise.resolve([])]);
        return { original, tipos, fornecedores, fechamentos: codigo ? fechamentos : fechamentos.filter(f => f.valorTotalLeite !== null && !receitas.some(r => r.codFechamento === f.codFechamento)) };
    }, [tipo, codigo, custo]));
    return <main className="conteudo-dashboard pagina-financeiro"><CabecalhoModulo titulo={`${codigo ? "Editar" : "Registrar"} ${custo ? "custo" : "receita"}`} descricao="Informe os dados efetivamente realizados e os vínculos do lançamento." /><EstadoConsulta consulta={consulta} />{consulta.dados && <FormularioLancamento tipo={tipo} {...consulta.dados} />}</main>;
}
