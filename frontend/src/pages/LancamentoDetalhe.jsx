import "../styles/financeiro.css";
import { useCallback } from "react";
import service from "../services/financeiro.service.js";
import useConsulta from "../hooks/useConsulta.js";
import { CabecalhoModulo, EstadoConsulta } from "../components/Modulo.jsx";
import Anexos from "../components/Anexos.jsx";
import { dataCivil, moeda } from "../utils/formatacao.js";
// Mostrar os dados e os comprovantes do lançamento
export default function LancamentoDetalhe({ tipo, codigo }) {
    const consulta = useConsulta(useCallback(signal => service.buscar(tipo, codigo, signal), [tipo, codigo]));
    const r = consulta.dados, custo = tipo === "custos";
    return <main className="conteudo-dashboard pagina-financeiro"><CabecalhoModulo titulo={custo ? "Detalhes do custo" : "Detalhes da receita"} descricao={r?.descricao || "Dados do lançamento e comprovantes."}><a className="botao-secundario" href={`#/financeiro/${tipo}`}>Voltar à lista</a><a className="botao-primario" href={`#/financeiro/${tipo}/${codigo}/editar`}>Editar lançamento</a></CabecalhoModulo><EstadoConsulta consulta={consulta} />{r && <><section className="painel"><dl className="grade-detalhes">{[["Descrição", r.descricao], ["Data", dataCivil(custo ? r.dataCusto : r.dataReceita)], ["Valor", moeda(r.valor)], ["Tipo", (custo ? r.tipoCusto : r.tipoReceita)?.nome || "Não informado"], [custo ? "Fornecedor" : "Origem", custo ? r.fornecedor?.nome || "Não informado" : r.codFechamento ? <a href={`#/leite/fechamentos/${r.codFechamento}`}>Fechamento do leite</a> : "Receita avulsa"]].map(([titulo, valor]) => <div key={titulo}><dt>{titulo}</dt><dd>{valor}</dd></div>)}</dl></section>
            <Anexos alvo={custo ? { codCusto: Number(codigo) } : { codReceita: Number(codigo) }} documentos={(custo ? r.documentosCusto : r.documentosReceita).map(v => v.documento)} gestor aoAlterar={consulta.recarregar} />
        </>}</main>;
}
