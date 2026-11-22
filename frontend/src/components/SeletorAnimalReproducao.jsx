import { useEffect, useId, useRef, useState } from "react";
import IdentificacaoAnimal from "./IdentificacaoAnimal.jsx";

// Remover acentos e padronizar o texto para a busca
const normalizar = texto => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

// Buscar e selecionar o animal do evento reprodutivo
export default function SeletorAnimalReproducao({ animais, value, onChange, name = "codAnimal", titulo = "Animal *", vazio = "Selecione a fêmea", disabled = false }) {
    const id = useId();
    const caixa = useRef(null), botao = useRef(null), buscaInput = useRef(null);
    const [aberto, setAberto] = useState(false), [busca, setBusca] = useState("");
    const selecionado = animais.find(a => String(a.codAnimal) === String(value));
    const resultados = animais.filter(a => normalizar(`${a.nome || ""} ${a.brinco || ""}`).includes(normalizar(busca.trim())));
    useEffect(() => {
        if (!aberto) return;
        buscaInput.current?.focus();
        // Fechar a busca quando o clique acontece fora dela
        const fora = e => { if (!caixa.current?.contains(e.target)) setAberto(false); };
        document.addEventListener("pointerdown", fora);
        return () => document.removeEventListener("pointerdown", fora);
    }, [aberto]);
    // Guardar o animal escolhido e fechar a busca
    function escolher(valor) {
        onChange({ target: { name, value: valor, type: "select-one" } });
        setAberto(false); setBusca(""); botao.current?.focus();
    }
    return <div ref={caixa} className="campo-modulo seletor-animal-reproducao" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setAberto(false); }}
        onKeyDown={e => {
            if (e.key === "Escape") { e.preventDefault(); setAberto(false); botao.current?.focus(); }
            if (["ArrowDown", "ArrowUp"].includes(e.key) && aberto) {
                e.preventDefault();
                const opcoes = [...caixa.current.querySelectorAll('[role="option"]')];
                const indice = opcoes.indexOf(document.activeElement);
                opcoes[(indice + (e.key === "ArrowDown" ? 1 : -1) + opcoes.length) % opcoes.length]?.focus();
            }
        }}>
        <span id={`${id}-rotulo`}>{titulo}</span>
        <button ref={botao} name={name} type="button" className="botao-seletor-animal" disabled={disabled} aria-labelledby={`${id}-rotulo ${id}-valor`}
            aria-haspopup="listbox" aria-expanded={aberto} aria-controls={aberto ? `${id}-opcoes` : undefined} onClick={() => setAberto(v => !v)}>
            <span id={`${id}-valor`}>{selecionado ? <IdentificacaoAnimal animal={selecionado} /> : vazio}</span><span aria-hidden="true">⌄</span>
        </button>
        {aberto && <div className="opcoes-animal-reproducao">
            <input ref={buscaInput} type="search" aria-label="Buscar animal por nome ou brinco" placeholder="Buscar nome ou brinco" value={busca} onInput={e => setBusca(e.target.value)} />
            <div id={`${id}-opcoes`} role="listbox" aria-labelledby={`${id}-rotulo`}>
                <button type="button" role="option" aria-selected={!value} onClick={() => escolher("")}>{vazio}</button>
                {resultados.map(a => <button key={a.codAnimal} type="button" role="option" aria-selected={String(a.codAnimal) === String(value)} onClick={() => escolher(String(a.codAnimal))}><IdentificacaoAnimal animal={a} /></button>)}
            </div>
            {!resultados.length && <p role="status">Nenhum animal encontrado.</p>}
        </div>}
    </div>;
}
