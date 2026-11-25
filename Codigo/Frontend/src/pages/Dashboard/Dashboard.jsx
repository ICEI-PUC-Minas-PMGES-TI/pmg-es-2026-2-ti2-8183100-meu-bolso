import styles from "./Dashboard.module.css";
import { obterUsuario } from "../../service/Api";
import { saudacaoAgora } from "./saudacao";
import EvolucaoFinanceira from "../EvolucaoFinanceira/EvolucaoFinanceira";
import AlertaReserva from "../../components/ReservaEmergencia/AlertaReserva";

function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.saudacao}>
        <h1>
          {saudacaoAgora()}, {obterUsuario()?.nome || "usuário"}
        </h1>
        <p className="texto-secundario">
          Veja para onde seu dinheiro foi e o que ainda dá para fazer neste mês.
        </p>
      </div>

      {/* Reserva de emergência: só aparece sem reserva ou abaixo do mínimo */}
      <AlertaReserva />

      {/* Evolução financeira (gráficos de gastos x renda, saldo e investimentos) */}
      <EvolucaoFinanceira />
    </div>
  );
}

export default Dashboard;
