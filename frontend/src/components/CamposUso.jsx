import { Campo } from "./Modulo.jsx";
import { identificarAnimal } from "../utils/formatacao.js";

// Preparar os campos de um novo uso de medicamento
export const usoVazio = () => ({ codAnimal: "", codMedicamento: "", dose: "", unidadeCarencia: "", valorCarencia: "", observacao: "" });

// Mostrar os campos da aplicação de medicamento
export default function CamposUso({ dados, onAlterar, animais, medicamentos, fixarAnimal = false, efetivo = false, onCadastrarMedicamento }) {
    // Atualizar o campo preenchido no formulário
    const alterar = e => onAlterar({ ...dados, [e.target.name]: e.target.value });
    return <div className="grade-formulario">
        <Campo titulo="Animal *"><select name="codAnimal" required disabled={fixarAnimal} value={dados.codAnimal} onChange={alterar}>
            <option value="">Selecione</option>{animais.map(a => <option key={a.codAnimal} value={a.codAnimal}>{identificarAnimal(a)}</option>)}
        </select></Campo>
        <div><Campo titulo="Medicamento *"><select name="codMedicamento" required value={dados.codMedicamento} onChange={alterar}>
            <option value="">Selecione</option>{medicamentos.map(m => <option key={m.codMedicamento} value={m.codMedicamento}>{m.nome}</option>)}
        </select></Campo>{onCadastrarMedicamento && <button type="button" className="botao-texto cadastrar-medicamento" onClick={onCadastrarMedicamento}>Cadastrar novo medicamento</button>}</div>
        <Campo titulo={efetivo ? "Dose efetiva *" : "Dose planejada"}><input name="dose" maxLength={50} required={efetivo} value={dados.dose || ""} onChange={alterar} placeholder="Informe dose e unidade" /></Campo>
        <Campo titulo={efetivo ? "Unidade da carência efetiva *" : "Unidade da carência"}><select name="unidadeCarencia" required={efetivo} value={dados.unidadeCarencia || ""} onChange={alterar}>
            <option value="">Não informada</option><option value="HORAS">Horas</option><option value="DIAS">Dias</option>
        </select></Campo>
        <Campo titulo={efetivo ? "Carência efetiva *" : "Valor da carência"}><input name="valorCarencia" type="number" min="0" max="2147483647" step="1" required={efetivo} value={dados.valorCarencia ?? ""} onChange={alterar} /></Campo>
        <Campo titulo="Observação"><textarea name="observacao" rows={2} value={dados.observacao || ""} onChange={alterar} /></Campo>
    </div>;
}
