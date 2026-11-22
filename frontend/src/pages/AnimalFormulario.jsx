import "../styles/animais.css";
import { useCallback, useRef, useState } from "react";
import animalService from "../services/animal.service.js";
import racaService from "../services/raca.service.js";
import useConsulta from "../hooks/useConsulta.js";
import usePaginaAtiva from "../hooks/usePaginaAtiva.js";
import { navegar } from "../hooks/useRota.js";
import { CabecalhoModulo, Campo, EstadoConsulta } from "../components/Modulo.jsx";
import { dataCivil, filtrosIniciais, identificarAnimal } from "../utils/formatacao.js";
import { prepararAnimal } from "../utils/animal.js";
import obterMensagemErro from "../utils/obterMensagemErro.js";
import NovaRaca from "../components/NovaRaca.jsx";

// Mostrar os campos para cadastrar ou editar um animal
export function FormularioAnimal({ animal, racas, animais, partos }) {
    const [formulario, setFormulario] = useState(() => ({ nome: "", brinco: "", sexo: "F", dataNascimento: "", categoria: "VACA",
        situacaoLactacao: "NAO_SE_APLICA", prenha: "N", codRaca: "", codAnimalMae: "", codParto: "", ...animal }));
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [criandoRaca, setCriandoRaca] = useState(false);
    const [novasRacas, setNovasRacas] = useState([]);
    const racasDisponiveis = [...racas, ...novasRacas.filter(nova => !racas.some(r => r.codRaca === nova.codRaca))];
    const trava = useRef(false);
    const ativa = usePaginaAtiva();
    const hoje = filtrosIniciais().dataAgenda;
    const destino = animal ? `/animais/${animal.codAnimal}` : "/animais";

    // Atualizar o campo preenchido no formulário
    function alterar(e) {
        const { name, value } = e.target;
        setFormulario(f => {
            const novo = { ...f, [name]: value };
            if (name === "sexo" && value === "M") Object.assign(novo, { prenha: "N", situacaoLactacao: "NAO_SE_APLICA" });
            if (name === "codAnimalMae") novo.codParto = "";
            if (name === "codParto" && value) {
                const parto = partos.find(p => p.codParto === Number(value));
                Object.assign(novo, { codAnimalMae: parto.codAnimalMae, dataNascimento: parto.dataParto });
            }
            return novo;
        });
    }

    // Conferir os campos e enviar o cadastro
    async function salvar(e) {
        e.preventDefault();
        if (trava.current) return;
        setErro("");
        let dados;
        try { dados = prepararAnimal(formulario); } catch (falha) { setErro(falha.message); return; }
        trava.current = true; setSalvando(true);
        try {
            const resultado = animal ? await animalService.atualizar(animal.codAnimal, dados)
                : await animalService.criar({ ...dados, situacaoRebanho: "ATIVA" });
            if (ativa.current) navegar(`/animais/${resultado.codAnimal}`);
        } catch (falha) { if (ativa.current) setErro(obterMensagemErro(falha)); }
        finally { trava.current = false; if (ativa.current) setSalvando(false); }
    }

    return <><form className="painel formulario-modulo" onSubmit={salvar} aria-busy={salvando}>
        {erro && <p role="alert" className="mensagem-erro">{erro}</p>}
        <p className="nota-limite">Campos com * são obrigatórios. {animal ? "A situação do rebanho é mantida; utilize Registrar saída para informar descarte ou óbito." : "O animal será cadastrado como ativo."}</p>
        <fieldset disabled={salvando}><legend>Identificação e classificação</legend><div className="grade-formulario">
            <Campo titulo="Nome *"><input name="nome" maxLength={100} required value={formulario.nome} onChange={alterar} /></Campo>
            <Campo titulo="Brinco *"><input name="brinco" maxLength={30} required value={formulario.brinco} onChange={alterar} /></Campo>
            <Campo titulo="Sexo *"><select name="sexo" value={formulario.sexo} onChange={alterar}><option value="F">Fêmea</option><option value="M">Macho</option></select></Campo>
            <Campo titulo="Nascimento *"><input name="dataNascimento" type="date" min="0001-01-01" max={hoje} required value={formulario.dataNascimento} onChange={alterar} readOnly={Boolean(formulario.codParto)} /></Campo>
            <Campo titulo="Categoria *"><input name="categoria" list="categorias-animal" maxLength={30} required value={formulario.categoria} onChange={alterar} />
                <datalist id="categorias-animal">{["VACA", "NOVILHA", "BEZERRA", "BEZERRO", "TOURO"].map(v => <option key={v} value={v} />)}</datalist></Campo>
            <div><Campo titulo="Raça"><select name="codRaca" value={formulario.codRaca ?? ""} onChange={alterar}><option value="">Não informada</option>{racasDisponiveis.map(r => <option key={r.codRaca} value={r.codRaca}>{r.nome}</option>)}</select></Campo>
                <button type="button" className="botao-texto cadastrar-nova-raca" onClick={() => setCriandoRaca(true)}>Cadastrar nova raça</button></div>
            <Campo titulo="Situação de lactação *"><select name="situacaoLactacao" disabled={formulario.sexo === "M"} value={formulario.situacaoLactacao} onChange={alterar}>
                <option value="NAO_SE_APLICA">Não se aplica</option><option value="EM_LACTACAO">Em lactação</option><option value="SECA">Seca</option>
            </select></Campo>
            <Campo titulo="Prenhe *" ajuda="Novos diagnósticos e alterações de gestação devem ser registrados no controle reprodutivo."><select name="prenha" disabled={formulario.sexo === "M"} value={formulario.prenha} onChange={alterar}><option value="N">Não</option><option value="S">Sim</option></select></Campo>
        </div></fieldset>
        <fieldset disabled={salvando}><legend>Origem do animal</legend><div className="grade-formulario">
            <Campo titulo="Mãe"><select name="codAnimalMae" value={formulario.codAnimalMae ?? ""} onChange={alterar}><option value="">Não informada</option>
                {animais.filter(a => a.sexo === "F" && a.codAnimal !== animal?.codAnimal).map(a => <option key={a.codAnimal} value={a.codAnimal}>{identificarAnimal(a)}</option>)}
            </select></Campo>
            <Campo titulo="Parto de nascimento" ajuda="Ao selecionar um parto, a mãe e a data de nascimento serão preenchidas automaticamente.">
                <select name="codParto" value={formulario.codParto ?? ""} onChange={alterar}><option value="">Não informado</option>
                    {partos.filter(p => p.codAnimalMae !== animal?.codAnimal && (!formulario.codAnimalMae || p.codAnimalMae === Number(formulario.codAnimalMae)))
                        .map(p => <option key={p.codParto} value={p.codParto}>{dataCivil(p.dataParto)} · {identificarAnimal(animais.find(a => a.codAnimal === p.codAnimalMae))}</option>)}
                </select>
            </Campo>
        </div></fieldset>
        <div className="acoes-modulo"><button className="botao-primario" disabled={salvando}>{salvando ? "Salvando…" : "Salvar animal"}</button>
            {!salvando && <a className="botao-secundario" href={`#${destino}`}>Cancelar</a>}</div>
    </form>{criandoRaca && <NovaRaca onFechar={() => setCriandoRaca(false)} onCriada={nova => {
        setNovasRacas(r => [...r, nova]);
        setFormulario(f => ({ ...f, codRaca: String(nova.codRaca) }));
        setCriandoRaca(false);
    }} />}</>;
}

// Carregar os dados necessários para o formulário do animal
export default function AnimalFormulario({ codigo }) {
    const consulta = useConsulta(useCallback(async signal => {
        const [animal, racas, animais, partos] = await Promise.all([
            codigo ? animalService.buscar(codigo, signal) : Promise.resolve(null), racaService.listar(signal),
            animalService.listar({}, signal), animalService.partos(signal),
        ]);
        return { animal, racas, animais, partos };
    }, [codigo]));
    return <main className="conteudo-dashboard pagina-animais"><CabecalhoModulo titulo={codigo ? "Editar animal" : "Cadastrar animal"} descricao="Mantenha a identificação e os vínculos do rebanho atualizados." />
        <EstadoConsulta consulta={consulta} />{consulta.dados && <FormularioAnimal {...consulta.dados} />}
    </main>;
}
