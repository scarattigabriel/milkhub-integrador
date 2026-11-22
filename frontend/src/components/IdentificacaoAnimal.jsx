// Mostrar o nome do animal e o brinco logo abaixo
export default function IdentificacaoAnimal({ animal }) {
    return <span className="identificacao-animal-linhas">
        <span>{animal?.nome || "Animal não informado"}</span>
        <small>Brinco {animal?.brinco ?? "não informado"}</small>
    </span>;
}
