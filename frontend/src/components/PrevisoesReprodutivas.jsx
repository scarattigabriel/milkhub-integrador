import { Campo } from "./Modulo.jsx";
// Mostrar os campos das previsões de parto e secagem
export default function PrevisoesReprodutivas({ dados, onAlterar, ajuste = false }) {
    // Atualizar o campo preenchido no formulário
    const alterar = e => onAlterar({ ...dados, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
    return <fieldset><legend>Previsões</legend>
        {!ajuste && <label className="opcao-marcacao"><input name="previsoesManuais" type="checkbox" checked={dados.previsoesManuais} onChange={alterar} />Informar previsões manualmente</label>}
        {!ajuste && !dados.previsoesManuais && <p className="nota-limite">Previsões calculadas a partir da inseminação.</p>}
        {(ajuste || dados.previsoesManuais) && <><div className="grade-formulario espaco-acima">
            <Campo titulo="Parto previsto"><input name="dataPrevisaoParto" type="date" min="0001-01-01" max="9999-12-31" value={dados.dataPrevisaoParto} onChange={alterar} /></Campo>
            <Campo titulo="Secagem prevista"><input name="dataPrevistaSecagem" type="date" min="0001-01-01" max="9999-12-31" disabled={dados.recalcularSecagem} value={dados.dataPrevistaSecagem} onChange={alterar} /></Campo>
        </div><label className="opcao-marcacao espaco-acima"><input name="recalcularSecagem" type="checkbox" checked={dados.recalcularSecagem} onChange={alterar} />Calcular a secagem ao definir ou alterar a previsão de parto</label></>}
    </fieldset>;
}
