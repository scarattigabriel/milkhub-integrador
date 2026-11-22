import SeletorAnimal from "../components/SeletorAnimalReproducao.jsx";
import IdentificacaoAnimal from "../components/IdentificacaoAnimal.jsx";
import "../styles/reproducao.css";
import { useCallback, useState } from "react";
import service from "../services/reproducao.service.js";
import animalService from "../services/animal.service.js";
import useConsulta from "../hooks/useConsulta.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { dataCivil, rotulo } from "../utils/formatacao.js";
import AbasReproducao from "../components/AbasReproducao.jsx";

// Mostrar os registros reprodutivos e suas ações
export function TabelaReproducao({ registros, tipo }) {
    return <div className="tabela-rolagem" role="region" tabIndex="0" aria-label="Tabela com rolagem horizontal"><table className="tabela-modulo"><thead><tr><th>Animal</th><th>Data / previsão</th><th>Situação / resultado</th><th>Informações</th><th>Ações</th></tr></thead><tbody>{registros.map(r => {
        const chave = r[{ inseminacoes: "codInseminacao", diagnosticos: "codDiagnostico", gestacoes: "codGestacao", secagens: "codSecagem", partos: "codParto" }[tipo]];
        if (["secagens", "partos"].includes(tipo)) return <tr key={chave}><th scope="row"><a href={`#/animais/${tipo === "partos" ? r.codAnimalMae : r.codAnimal}`}><IdentificacaoAnimal animal={tipo === "partos" ? r.mae : r.animal} /></a></th><td>{dataCivil(tipo === "partos" ? r.dataParto : r.dataSecagem)}</td><td>Realizado</td><td className="texto-longo">{r.observacao || "—"}{tipo === "partos" && <ul>{r.crias.map(a => <li key={a.codAnimal}><a href={`#/animais/${a.codAnimal}`}><IdentificacaoAnimal animal={a} /></a></li>)}</ul>}</td><td className="acoes-tabela">{r.codGestacao ? <a className="botao-secundario" href={`#/reproducao/gestacoes/${r.codGestacao}`}>Ver gestação</a> : "—"}</td></tr>;
        return <tr key={chave}><th scope="row"><a href={`#/animais/${r.codAnimal}`}><IdentificacaoAnimal animal={r.animal} /></a></th>
            <td>{dataCivil(tipo === "inseminacoes" ? r.dataInseminacao : tipo === "diagnosticos" ? r.dataDiagnostico : r.dataPrevisaoParto)}</td>
            <td>{rotulo(tipo === "inseminacoes" ? r.confirmacaoPrenhez : tipo === "diagnosticos" ? r.resultado : r.situacao)}</td>
            <td className="texto-longo">{tipo === "inseminacoes" ? <>{r.reprodutor?.nome || "Reprodutor não informado"}<br />Diagnóstico sugerido: {dataCivil(r.janelaDiagnostico.inicio)} a {dataCivil(r.janelaDiagnostico.fim)}</> : tipo === "diagnosticos" ? <>{r.metodo}{r.observacao && <p>{r.observacao}</p>}</> : <>Secagem prevista: {dataCivil(r.dataPrevistaSecagem)}<br />{r.codInseminacao ? "Inseminação vinculada" : ""}</>}</td>
            <td className="acoes-tabela">{tipo === "inseminacoes" ? <a className="botao-secundario" href={`#/reproducao/inseminacoes/${chave}`}>Detalhes</a> : tipo === "gestacoes" ? <a className="botao-secundario" href={`#/reproducao/gestacoes/${chave}`}>Abrir gestação</a> : r.codGestacao ? <a className="botao-secundario" href={`#/reproducao/gestacoes/${r.codGestacao}`}>Ver gestação</a> : r.codInseminacao ? <a className="botao-secundario" href={`#/reproducao/inseminacoes/${r.codInseminacao}`}>Ver inseminação</a> : "—"}</td>
        </tr>;
    })}</tbody></table></div>;
}

// Carregar os registros da aba de reprodução selecionada
export default function Reproducao({ gestor, tipo = "inseminacoes" }) {
    const [animal, setAnimal] = useState("");
    const [estado, setEstado] = useState("");
    const [filtro, setFiltro] = useState({});
    const [pendentes, setPendentes] = useState(false);
    const consulta = useConsulta(useCallback(async signal => {
        const [registros, animais] = await Promise.all([service.listar(tipo, filtro, signal), animalService.listar({ sexo: "F" }, signal)]);
        return { registros, animais };
    }, [tipo, filtro]));
    const registros = consulta.dados?.registros.filter(r => tipo !== "inseminacoes" || !pendentes || ["PENDENTE", "INCONCLUSIVO"].includes(r.confirmacaoPrenhez)) || [];
    const estados = tipo === "gestacoes" ? ["EM_ANDAMENTO", "ENCERRADA_PARTO", "ENCERRADA_NEGATIVO", "ENCERRADA_PERDA"] : ["POSITIVO", "NEGATIVO", "INCONCLUSIVO"];
    return <main className="conteudo-dashboard pagina-reproducao"><CabecalhoModulo titulo="Controle reprodutivo" descricao="Acompanhe os ciclos e eventos reprodutivos do rebanho."><a className="botao-secundario" href="#/reprodutores">Reprodutores</a>{gestor && <a className="botao-primario" href={`#/reproducao/${tipo}/nova`}>{{ inseminacoes: "Registrar inseminação", diagnosticos: "Registrar diagnóstico", gestacoes: "Gestação adquirida", secagens: "Registrar secagem", partos: "Registrar parto" }[tipo]}</a>}</CabecalhoModulo>
        <AbasReproducao tipo={tipo} /><form className="painel filtros-modulo" onSubmit={e => { e.preventDefault(); setFiltro({ ...(animal ? { codAnimal: animal } : {}), ...(estado && tipo !== "inseminacoes" ? { [tipo === "gestacoes" ? "situacao" : "resultado"]: estado } : {}) }); }}>
            <SeletorAnimal titulo="Animal" vazio="Todas as fêmeas" animais={consulta.dados?.animais || []} value={animal} onChange={e => setAnimal(e.target.value)} />
            {tipo === "inseminacoes" ? <label className="opcao-marcacao"><input type="checkbox" checked={pendentes} onChange={e => setPendentes(e.target.checked)} />Sem diagnóstico conclusivo</label> : ["gestacoes", "diagnosticos"].includes(tipo) && <Campo titulo="Situação / resultado"><select value={estado} onChange={e => setEstado(e.target.value)}><option value="">Todos</option>{estados.map(v => <option key={v} value={v}>{rotulo(v)}</option>)}</select></Campo>}
            <button className="botao-primario" disabled={consulta.carregando}>Atualizar</button></form>
        <EstadoConsulta consulta={consulta} />{consulta.dados && <section className="painel"><p className="resumo-listagem">{registros.length} registros encontrados</p>{registros.length ? <TabelaReproducao registros={registros} tipo={tipo} /> : <p>Nenhum registro corresponde aos filtros.</p>}</section>}
    </main>;
}
