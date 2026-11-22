import "../styles/animais.css";
import { useCallback, useState } from "react";
import animalService from "../services/animal.service.js";
import racaService from "../services/raca.service.js";
import useConsulta from "../hooks/useConsulta.js";
import { CabecalhoModulo, EstadoConsulta, Campo, Situacao } from "../components/Modulo.jsx";
import { dataCivil, rotulo } from "../utils/formatacao.js";
import { ordenarAnimais } from "../utils/animal.js";

const iniciais = { busca: "", situacaoRebanho: "ATIVA", sexo: "", categoria: "", situacaoLactacao: "", prenha: "", codRaca: "" };

// Mostrar os animais encontrados e as ações de cada um
export function TabelaAnimais({ animais, gestor }) {
    return <div className="tabela-rolagem" role="region" tabIndex="0" aria-label="Tabela com rolagem horizontal"><table className="tabela-modulo"><caption className="somente-leitor">Animais encontrados</caption>
        <thead><tr>{["Animal / brinco", "Sexo", "Categoria", "Raça", "Nascimento", "Lactação", "Prenhez", "Situação", "Ações"].map(t => <th key={t} scope="col">{t}</th>)}</tr></thead>
        <tbody>{animais.map(a => <tr key={a.codAnimal}>
            <th scope="row"><a href={`#/animais/${a.codAnimal}`}>{a.nome}</a><small>{a.brinco}</small></th>
            <td>{a.sexo === "F" ? "Fêmea" : "Macho"}</td><td>{rotulo(a.categoria)}</td><td>{a.raca?.nome || "Não informada"}</td>
            <td>{dataCivil(a.dataNascimento)}</td><td>{rotulo(a.situacaoLactacao)}</td><td>{a.prenha === "S" ? "Sim" : "Não"}</td>
            <td><Situacao valor={a.situacaoRebanho} /></td><td className="acoes-tabela"><a href={`#/animais/${a.codAnimal}`}>Detalhes</a>
                {gestor && <a href={`#/animais/${a.codAnimal}/editar`} aria-label={`Editar ${a.nome}`}>Editar</a>}</td>
        </tr>)}</tbody>
    </table></div>;
}

// Carregar o rebanho e permitir filtrar os animais
export default function Animais({ gestor }) {
    const [formulario, setFormulario] = useState(iniciais);
    const [filtros, setFiltros] = useState(iniciais);
    const [pagina, setPagina] = useState(1);
    const [ordem, setOrdem] = useState("nome-asc");
    const consulta = useConsulta(useCallback(async signal => {
        const [animais, racas] = await Promise.all([animalService.listar(filtros, signal), racaService.listar(signal)]);
        return { animais, racas };
    }, [filtros]));
    // Atualizar o campo preenchido no formulário
    const alterar = e => setFormulario(f => ({ ...f, [e.target.name]: e.target.value }));
    const paginas = Math.max(1, Math.ceil((consulta.dados?.animais.length || 0) / 15));
    const animaisOrdenados = ordenarAnimais(consulta.dados?.animais || [], ordem);

    return <main className="conteudo-dashboard pagina-animais">
        <CabecalhoModulo titulo="Animais" descricao="Consulte o rebanho e acompanhe o histórico de cada animal.">
            {gestor && <a className="botao-primario" href="#/animais/novo">Cadastrar animal</a>}
        </CabecalhoModulo>
        <form className="filtros-modulo painel" onSubmit={e => { e.preventDefault(); setPagina(1); setFiltros({ ...formulario }); }}>
            <Campo titulo="Nome ou brinco"><input name="busca" maxLength={100} value={formulario.busca} onChange={alterar} placeholder="Buscar animal" /></Campo>
            <Campo titulo="Situação"><select name="situacaoRebanho" value={formulario.situacaoRebanho} onChange={alterar}><option value="">Todas</option><option value="ATIVA">Ativos</option><option value="INATIVA">Inativos</option></select></Campo>
            <Campo titulo="Sexo"><select name="sexo" value={formulario.sexo} onChange={alterar}><option value="">Todos</option><option value="F">Fêmeas</option><option value="M">Machos</option></select></Campo>
            <Campo titulo="Categoria"><input name="categoria" maxLength={30} value={formulario.categoria} onChange={alterar} placeholder="Ex.: VACA" /></Campo>
            <Campo titulo="Lactação"><select name="situacaoLactacao" value={formulario.situacaoLactacao} onChange={alterar}><option value="">Todas</option><option value="EM_LACTACAO">Em lactação</option><option value="SECA">Seca</option><option value="NAO_SE_APLICA">Não se aplica</option></select></Campo>
            <Campo titulo="Prenhez"><select name="prenha" value={formulario.prenha} onChange={alterar}><option value="">Todas</option><option value="S">Sim</option><option value="N">Não</option></select></Campo>
            <Campo titulo="Raça"><select name="codRaca" value={formulario.codRaca} onChange={alterar}><option value="">Todas</option>{consulta.dados?.racas.map(r => <option key={r.codRaca} value={r.codRaca}>{r.nome}</option>)}</select></Campo>
            <div className="acoes-modulo"><button className="botao-primario" disabled={consulta.carregando}>Filtrar</button>
                <button type="button" className="botao-secundario" disabled={consulta.carregando} onClick={() => { setFormulario(iniciais); setFiltros({ ...iniciais }); setPagina(1); setOrdem("nome-asc"); }}>Limpar</button></div>
        </form>
        <EstadoConsulta consulta={consulta} />
        {consulta.dados && <section className="painel"><p className="resumo-listagem" role="status">{consulta.dados.animais.length} animais encontrados</p>
            <div className="ordenacao-animais"><Campo titulo="Ordenar por"><select value={ordem} onChange={e => { setOrdem(e.target.value); setPagina(1); }}>
                <option value="nome-asc">Nome: A–Z</option><option value="nome-desc">Nome: Z–A</option>
                <option value="nascimento-desc">Nascimento: mais recente</option><option value="nascimento-asc">Nascimento: mais antigo</option>
            </select></Campo></div>
            {animaisOrdenados.length ? <TabelaAnimais animais={animaisOrdenados.slice((pagina - 1) * 15, pagina * 15)} gestor={gestor} /> : <p className="texto-vazio">Nenhum animal corresponde aos filtros.</p>}
            {paginas > 1 && <nav className="paginacao" aria-label="Páginas de animais"><button className="botao-secundario" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</button><span>Página {pagina} de {paginas}</span><button className="botao-secundario" disabled={pagina >= paginas} onClick={() => setPagina(p => p + 1)}>Próxima</button></nav>}
        </section>}
    </main>;
}
