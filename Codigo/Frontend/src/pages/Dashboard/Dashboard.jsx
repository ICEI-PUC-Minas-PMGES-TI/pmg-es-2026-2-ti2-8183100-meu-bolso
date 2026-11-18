import styles from "./Dashboard.module.css";
import { obterUsuario } from "../../service/Api";
import EvolucaoFinanceira from "../EvolucaoFinanceira/EvolucaoFinanceira";

function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.saudacao}>
        <h1>Bom dia, {obterUsuario()?.nome || "usuário"}</h1>
        <p className="texto-secundario">
          Veja para onde seu dinheiro foi e o que ainda dá para fazer neste mês.
        </p>
      </div>

      {/* Evolução financeira (gráficos de gastos x renda, saldo e investimentos) */}
      <EvolucaoFinanceira />
    </div>
  );
}

export default Dashboard;
