import "../styles/leite.css";
import { useCallback, useState } from "react";
import service from "../services/leite.service.js";
import useConsulta from "../hooks/useConsulta.js";
import useGravacao from "../hooks/useGravacao.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { filtrosIniciais } from "../utils/formatacao.js";
import { prepararColeta, rotaPeriodo } from "../utils/leiteFinanceiro.js";

// Mostrar os campos para cadastrar ou editar a coleta
export function FormularioColeta({ original = null }) {
    const [f, setF] = useState({ dataColeta: original?.dataColeta || filtrosIniciais().dataAgenda, volumeLitros: original?.volumeLitros || "", horarioColeta: original?.horarioColeta?.slice(0, 5) || "", resultadoAlizarol: original?.resultadoAlizarol || "", observacao: original?.observacao || "" });
    const gravacao = useGravacao();
    // Atualizar o campo preenchido no formulário
    const alterar = e => setF(v => ({ ...v, [e.target.name]: e.target.value }));
    // Conferir os campos e enviar o cadastro
    function salvar(e) { e.preventDefault(); let dados; try { dados = prepararColeta(f); } catch (falha) { gravacao.setErro(falha.message); return; }
        gravacao.executar(() => original ? service.atualizarColeta(original.codColeta, dados) : service.criarColeta(dados), c => navegar(rotaPeriodo("/leite", c.dataColeta))); }
    return <form className="painel formulario-modulo" onSubmit={salvar}>{gravacao.erro && <p role="alert" className="mensagem-erro">{gravacao.erro}</p>}<fieldset disabled={gravacao.salvando}><legend>Dados da coleta</legend><div className="grade-formulario">
        <Campo titulo="Data *"><input name="dataColeta" type="date" required min="0001-01-01" max={filtrosIniciais().dataAgenda} value={f.dataColeta} onChange={alterar} /></Campo>
        <Campo titulo="Volume em litros *" ajuda="Até duas casas decimais, sem separador de milhar."><input name="volumeLitros" inputMode="decimal" required value={f.volumeLitros} onChange={alterar} /></Campo>
        <Campo titulo="Horário (Brasília)"><input name="horarioColeta" type="time" step="60" value={f.horarioColeta} onChange={alterar} /></Campo>
        <Campo titulo="Resultado do alizarol"><select name="resultadoAlizarol" value={f.resultadoAlizarol} onChange={alterar}><option value="">Não realizado</option><option value="Estável">Estável</option><option value="Não estável">Não estável</option></select></Campo>
        <Campo titulo="Observação"><textarea name="observacao" rows={3} value={f.observacao} onChange={alterar} /></Campo>
    </div></fieldset><p className="nota-limite">O fechamento é associado automaticamente ao mês da coleta. Mudar a data para outro mês atualiza esse vínculo.</p><div className="acoes-modulo"><button className="botao-primario" disabled={gravacao.salvando}>{gravacao.salvando ? "Salvando…" : "Salvar coleta"}</button>{!gravacao.salvando && <a className="botao-secundario" href="#/leite">Cancelar</a>}</div></form>;
}
// Carregar a coleta e preparar o formulário
export default function ColetaFormulario({ codigo }) {
    const consulta = useConsulta(useCallback(signal => codigo ? service.coleta(codigo, signal) : Promise.resolve(null), [codigo]));
    return <main className="conteudo-dashboard pagina-leite"><CabecalhoModulo titulo={codigo ? "Editar coleta" : "Registrar coleta"} descricao="Informe o volume coletado e os dados efetivamente registrados." /><EstadoConsulta consulta={consulta} />{!consulta.carregando && !consulta.erro && <FormularioColeta original={consulta.dados} />}</main>;
}
