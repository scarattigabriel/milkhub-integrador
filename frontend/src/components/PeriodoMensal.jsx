import { useState } from "react";
import { Campo } from "./Modulo.jsx";
import { meses } from "../utils/formatacao.js";
// Mostrar os campos de mês e ano da consulta
export default function PeriodoMensal({ valor, onAplicar, carregando }) {
    const [f, setF] = useState(valor);
    return <form className="painel filtros-modulo" onSubmit={e => { e.preventDefault(); onAplicar({ mes: Number(f.mes), ano: Number(f.ano) }); }}>
        <Campo titulo="Mês"><select value={f.mes} onChange={e => setF(v => ({ ...v, mes: e.target.value }))}>{meses.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></Campo>
        <Campo titulo="Ano"><input type="number" min="1" max="9999" step="1" required value={f.ano} onChange={e => setF(v => ({ ...v, ano: e.target.value }))} /></Campo>
        <button className="botao-primario" disabled={carregando}>Atualizar período</button>
    </form>;
}
