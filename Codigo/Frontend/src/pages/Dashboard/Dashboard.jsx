import styles from "./Dashboard.module.css";
import { obterUsuario } from "../../service/Api";
import EvolucaoFinanceira from "../EvolucaoFinanceira/EvolucaoFinanceira";
import AlertaReserva from "../../components/ReservaEmergencia/AlertaReserva";

function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.saudacao}>
        <h1>
          Seja bem-vindo,{" "}
          <span className={styles.nome}>{obterUsuario()?.nome || "usuário"}</span>
        </h1>
      </div>

      {/* Reserva de emergência: só aparece sem reserva ou abaixo do mínimo */}
      <AlertaReserva />

      {/* Evolução financeira (gráficos de gastos x renda, saldo e investimentos) */}
      <EvolucaoFinanceira mostrarResumo />
    </div>
  );
}

export default Dashboard;
