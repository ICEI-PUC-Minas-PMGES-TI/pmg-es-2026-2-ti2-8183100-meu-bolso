import Cartao from "./Cartao";
import Cedula from "./Cedula";
import Conta from "./Conta";

/**
 * Renderiza a representação visual de uma carteira conforme o tipo.
 * Centraliza a escolha para a página/painel não precisarem saber
 * qual componente usar.
 *
 * props:
 *  - tipo: "cartao" | "dinheiro" | "conta" | "reserva"
 *  - ...demais props repassadas ao componente específico
 */
function CarteiraVisual({ tipo = "cartao", ...props }) {
  switch (tipo) {
    case "dinheiro":
      return <Cedula {...props} />;
    case "conta":
    case "reserva":
      return <Conta tipo={tipo} {...props} />;
    case "cartao":
    default:
      return <Cartao {...props} />;
  }
}

export default CarteiraVisual;
