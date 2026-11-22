import "../styles/leite.css";
import { useCallback, useState } from "react";
import service from "../services/leite.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { moeda, numero } from "../utils/formatacao.js";
import { prepararFechamento } from "../utils/leiteFinanceiro.js";
import financeiroService from "../services/financeiro.service.js";
import Anexos from "../components/Anexos.jsx";
import QualidadeLeite from "../components/QualidadeLeite.jsx";

// Mostrar os valores e a observação do fechamento de leite
export function FormularioFechamento({ original, aoSalvar }) {
    const [f, setF] = useState({ valorTotalLeite: original.valorTotalLeite ?? "", observacao: original.observacao || "" });
    const gravacao = useGravacao();
    // Conferir os campos e enviar o cadastro
    function salvar(e) { e.preventDefault(); let dados; try { dados = prepararFechamento(f); } catch (falha) { gravacao.setErro(falha.message); return; } gravacao.executar(() => service.atualizarFechamento(original.codFechamento, dados), aoSalvar); }
    return <form className="formulario-modulo" onSubmit={salvar}>{gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}<fieldset disabled={gravacao.salvando}><legend>Valor e observações do mês</legend><div className="grade-formulario"><Campo titulo="Valor total do leite (R$)"><input inputMode="decimal" value={f.valorTotalLeite} onChange={e => setF(v => ({ ...v, valorTotalLeite: e.target.value }))} /></Campo><Campo titulo="Observação"><textarea rows={3} value={f.observacao} onChange={e => setF(v => ({ ...v, observacao: e.target.value }))} /></Campo></div></fieldset><p className="nota-limite">Valor informado na contranota.</p><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : "Salvar fechamento"}</button></form>;
}
// Carregar o fechamento e permitir atualizar seus dados
export default function FechamentoLeite({ codigo, gestor }) {
    const [mensagem, setMensagem] = useState("");
    const consulta = useConsulta(useCallback(async signal => { const f = await service.fechamento(codigo, signal); const [resumo, tiposReceita] = await Promise.all([service.resumo({ mes: f.mesReferencia, ano: f.anoReferencia }, signal), gestor ? financeiroService.listar("tipos-receita", {}, signal) : Promise.resolve([])]); return { ...resumo, tiposReceita }; }, [codigo, gestor]));
    const r = consulta.dados;
    return <main className="conteudo-dashboard pagina-leite"><CabecalhoModulo titulo="Fechamento do leite" descricao={r ? `Referência ${r.periodo.mes}/${r.periodo.ano}` : "Valor mensal, observações e qualidade do leite."}><a className="botao-secundario" href="#/leite">Voltar às coletas</a></CabecalhoModulo><EstadoConsulta consulta={consulta} />{mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
        {r && <><section className="painel"><dl className="grade-detalhes">{[["Volume coletado", `${numero(r.totalLitros)} L`], ["Coletas", r.quantidadeColetas], ["Valor mensal", r.valorTotalLeite === null ? "Não informado" : moeda(r.valorTotalLeite)]].map(([titulo, valor]) => <div key={titulo}><dt>{titulo}</dt><dd>{valor}</dd></div>)}</dl>{gestor ? <FormularioFechamento original={r.fechamento} aoSalvar={() => { setMensagem("Fechamento atualizado."); consulta.recarregar(); }} /> : <p className="texto-longo">{r.fechamento.observacao || "Sem observações."}</p>}</section>
            <section className="painel espaco-acima"><h2 className="titulo-secao">Índices de qualidade</h2>{r.indicesQualidade.length ? <ul className="lista-registros">{r.indicesQualidade.map(i => <li key={i.nome}><strong>{i.nome}</strong><span>{i.valor} {i.unidade || ""}</span></li>)}</ul> : <p>Nenhum índice transcrito para este mês.</p>}{gestor && <QualidadeLeite codigo={codigo} indices={r.indicesQualidade} aoSalvar={() => { setMensagem("Índices de qualidade atualizados."); consulta.recarregar(); }} />}</section>
            <Anexos alvo={{ codFechamento: Number(codigo) }} documentos={r.documentos} gestor={gestor} tiposReceita={r.tiposReceita} aoAlterar={() => { setMensagem("Documentos atualizados."); consulta.recarregar(); }} />
        </>}
    </main>;
}
