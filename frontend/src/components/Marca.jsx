import logoMilkHub from "../assets/milkhub-logo.png";

// Mostrar a logo do MilkHub
function Marca() {
    return (
        <div className="marca">
            <img className="marca-logo" src={logoMilkHub} alt="MilkHub" width="2160" height="720" />
        </div>
    );
}

export default Marca;
