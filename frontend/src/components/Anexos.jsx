import { useState } from "react";
import service, { tipoDoArquivo, salvarDownload } from "../services/documento.service.js";
import useGravacao from "../hooks/useGravacao.js";
import { Campo } from "./Modulo.jsx";
import { prepararAnexo } from "../utils/leiteFinanceiro.js";
import { dataHora, filtrosIniciais } from "../utils/formatacao.js";

// Mostrar os documentos e permitir enviar ou baixar anexos
export default function Anexos({ alvo, documentos, gestor, tiposReceita = [], aoAlterar }) {
    const [arquivo, setArquivo] = useState(null);
    const [exclusao, setExclusao] = useState(null);
    const [f, setF] = useState({ tipoDocumento: alvo.codFechamento ? "RELATORIO_QUALIDADE" : "COMPROVANTE", descricao: "", atualizarValor: false, valorTotalLeite: "", contabilizar: false, codTipoReceita: "", dataReceita: filtrosIniciais().dataAgenda, descricaoReceita: "" });
    const gravacao = useGravacao();
    // Atualizar o campo preenchido no formulário
    const alterar = e => setF(v => ({ ...v, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
    // Enviar os dados e mostrar se houve algum erro
    function enviar(e) { e.preventDefault(); let dados; try { tipoDoArquivo(arquivo); dados = prepararAnexo(f, alvo); } catch (falha) { gravacao.setErro(falha.message); return; } gravacao.executar(() => service.anexar(arquivo, dados), aoAlterar); }
    const tipos = alvo.codFechamento ? [["RELATORIO_QUALIDADE", "Relatório de qualidade"], ["CONTRANOTA", "Contranota"], ["OUTRO", "Outro"]] : [["COMPROVANTE", "Comprovante"], ["NOTA_FISCAL", "Nota fiscal"], ["OUTRO", "Outro"]];
    return <section className="painel espaco-acima"><h2 className="titulo-secao">Documentos e comprovantes</h2>{gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}
        {documentos.length ? <ul className="lista-registros">{documentos.map(d => <li key={d.codDocumento}><strong>{d.nomeArquivo}</strong><span>{d.descricao || "Sem descrição"} · {dataHora(d.dataHoraInclusao)}</span><div className="acoes-modulo"><button className="botao-texto" disabled={gravacao.salvando} onClick={() => gravacao.executar(() => service.baixar(d.codDocumento), blob => salvarDownload(blob, d.nomeArquivo))}>Baixar</button>{gestor && <button className="botao-texto" disabled={gravacao.salvando} onClick={() => setExclusao(d)}>Excluir anexo</button>}</div></li>)}</ul> : <p>Nenhum documento anexado.</p>}
        {exclusao && <div className="confirmar-exclusao"><p>Excluir o documento {exclusao.nomeArquivo}? O lançamento e os valores do leite serão preservados.</p><div className="acoes-modulo"><button className="botao-perigo" disabled={gravacao.salvando} onClick={() => gravacao.executar(() => service.excluir(exclusao.codDocumento), aoAlterar)}>Confirmar exclusão do anexo</button><button className="botao-secundario" disabled={gravacao.salvando} onClick={() => setExclusao(null)}>Cancelar</button></div></div>}
        {gestor && <form className="formulario-modulo espaco-acima" onSubmit={enviar}><fieldset disabled={gravacao.salvando}><legend>Anexar documento</legend><div className="grade-formulario">
            <Campo titulo="Arquivo *" ajuda="PDF, PNG ou JPEG de até 10 MiB."><input name="arquivo" type="file" required accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg" onChange={e => setArquivo(e.target.files[0] || null)} /></Campo>
            <Campo titulo="Tipo *"><select name="tipoDocumento" value={f.tipoDocumento} onChange={alterar}>{tipos.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></Campo>
            <Campo titulo="Descrição"><input name="descricao" maxLength={255} value={f.descricao} onChange={alterar} /></Campo>
        </div>
            {alvo.codFechamento && f.tipoDocumento === "CONTRANOTA" && <div className="espaco-acima"><p className="nota-limite">Transcreva os dados da contranota, se desejar. Não há leitura automática do arquivo.</p>
                <label className="opcao-marcacao"><input name="atualizarValor" type="checkbox" checked={f.atualizarValor} onChange={alterar} />Atualizar o valor total do leite a partir desta contranota</label>
                {f.atualizarValor && <Campo titulo="Valor total do leite (R$) *"><input name="valorTotalLeite" inputMode="decimal" required value={f.valorTotalLeite} onChange={alterar} /></Campo>}
                <label className="opcao-marcacao espaco-acima"><input name="contabilizar" type="checkbox" checked={f.contabilizar} onChange={alterar} />Gerar ou atualizar o recebimento vinculado ao fechamento</label>
                {f.contabilizar && <div className="grade-formulario espaco-acima"><Campo titulo="Tipo de receita *"><select name="codTipoReceita" required value={f.codTipoReceita} onChange={alterar}><option value="">Selecione</option>{tiposReceita.map(t => <option key={t.codTipoReceita} value={t.codTipoReceita}>{t.nome}</option>)}</select></Campo><Campo titulo="Data do recebimento *"><input name="dataReceita" type="date" min="0001-01-01" max={filtrosIniciais().dataAgenda} required value={f.dataReceita} onChange={alterar} /></Campo><Campo titulo="Descrição do recebimento"><input name="descricaoReceita" maxLength={255} value={f.descricaoReceita} onChange={alterar} /></Campo></div>}
            </div>}
        </fieldset><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Enviando…" : "Anexar documento"}</button></form>}
    </section>;
}
