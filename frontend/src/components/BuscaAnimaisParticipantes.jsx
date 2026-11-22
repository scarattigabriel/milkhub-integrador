import { useState } from "react";
import { Campo } from "./Modulo.jsx";
import { identificarAnimal } from "../utils/formatacao.js";

// Remover acentos e padronizar o texto para a busca
const normalizar = texto => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

// Buscar animais e mostrar os que já foram selecionados
export default function BuscaAnimaisParticipantes({ animais, selecionados, onSelecionar, onRemover }) {
    const [busca, setBusca] = useState("");
    const termo = normalizar(busca.trim());
    const encontrados = termo ? animais.filter(a => !selecionados.includes(String(a.codAnimal)) && normalizar(identificarAnimal(a)).includes(termo)) : [];
    return <div className="busca-participantes">
        <Campo titulo="Buscar animal por nome ou brinco"><input type="search" value={busca} onInput={e => setBusca(e.target.value)} placeholder="Digite o nome ou brinco" /></Campo>
        {termo && <div className="resultados-participantes" aria-label="Resultados da busca de animais">
            {encontrados.slice(0, 8).map(a => <button key={a.codAnimal} type="button" className="resultado-participante" onClick={() => { onSelecionar(String(a.codAnimal)); setBusca(""); }}>{identificarAnimal(a)} <span>Adicionar</span></button>)}
            <p className="nota-limite" role="status">{!encontrados.length ? "Nenhum animal disponível corresponde à busca." : encontrados.length > 8 ? "Exibindo os primeiros 8 resultados. Refine a busca para encontrar outro animal." : `${encontrados.length} resultado(s).`}</p>
        </div>}
        <ul className="participantes-selecionados" aria-label="Animais selecionados">{animais.filter(a => selecionados.includes(String(a.codAnimal))).map(a => <li key={a.codAnimal}>
            <span>{identificarAnimal(a)}</span><button type="button" className="botao-texto" aria-label={`Remover ${identificarAnimal(a)}`} onClick={() => onRemover(String(a.codAnimal))}>Remover</button>
        </li>)}</ul>
        {!selecionados.length && <p className="nota-limite">Nenhum animal selecionado.</p>}
    </div>;
}
