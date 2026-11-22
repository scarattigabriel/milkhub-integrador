import { useState } from "react";
import service from "../services/leite.service.js";
import useGravacao from "../hooks/useGravacao.js";
import { Campo } from "./Modulo.jsx";
import { prepararQualidade } from "../utils/leiteFinanceiro.js";
// Mostrar e permitir editar os índices de qualidade do leite
export default function QualidadeLeite({ codigo, indices, aoSalvar }) {
    const [linhas, setLinhas] = useState(() => indices.length ? indices.map(i => ({ ...i, valor: String(i.valor), unidade: i.unidade || "" })) : [{ nome: "", valor: "", unidade: "" }]);
    const gravacao = useGravacao();
    // Conferir os campos e enviar o cadastro
    function salvar(e) { e.preventDefault(); let dados; try { dados = prepararQualidade(linhas); } catch (falha) { gravacao.setErro(falha.message); return; } gravacao.executar(() => service.qualidade(codigo, dados), aoSalvar); }
    return <form className="formulario-modulo espaco-acima" onSubmit={salvar}>{gravacao.erro && <p className="mensagem-erro" role="alert">{gravacao.erro}</p>}<fieldset disabled={gravacao.salvando}><legend>Transcrever índices do relatório</legend><p className="nota-limite">Informe apenas dados presentes no relatório. Salvar substitui o conjunto de índices deste mês.</p>
        {linhas.map((linha, i) => <div className="uso-planejado" key={i}><div className="grade-formulario">{[["nome", "Índice *", 100], ["valor", "Valor *", 100], ["unidade", "Unidade", 30]].map(([campo, titulo, limite]) => <Campo key={campo} titulo={titulo}><input required={campo !== "unidade"} maxLength={limite} value={linha[campo]} onChange={e => setLinhas(v => v.map((r, j) => i === j ? { ...r, [campo]: e.target.value } : r))} /></Campo>)}</div><button type="button" className="botao-texto" disabled={linhas.length === 1} onClick={() => setLinhas(v => v.filter((_, j) => j !== i))}>Remover índice</button></div>)}
        <button type="button" className="botao-secundario" disabled={linhas.length >= 50} onClick={() => setLinhas(v => [...v, { nome: "", valor: "", unidade: "" }])}>Adicionar índice</button>
    </fieldset><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : "Salvar índices de qualidade"}</button></form>;
}
