import { PiggyBank } from "lucide-react";

import styles from "./EvolucaoFinanceira.module.css";
import GraficoEvolucao from "./GraficoEvolucao";

// Gráfico do total investido acumulado ao longo dos meses.
// Reaproveita o GraficoEvolucao (linha + pontos + tooltip), apenas
// alimentando-o com a série acumulada dos aportes de investimento.
//
// Os aportes vêm das metas marcadas como "investimento". Enquanto o
// backend não expõe esse dado, `dados` chega vazio e mostramos o
// estado "sem investimentos".
function GraficoInvestimento({ dados = [], altura, acoes }) {
  if (dados.length === 0) {
    return (
      <div className={`card ${styles.card} ${styles.estado}`}>
        <div className={styles.estadoTopo}>{acoes}</div>
        <PiggyBank size={32} className={styles.estadoIcone} aria-hidden="true" />
        <p className={styles.estadoTitulo}>Nenhum investimento ainda</p>
        <p className="texto-secundario">
          Marque uma meta como investimento para acompanhar seus aportes aqui.
        </p>
      </div>
    );
  }

  return (
    <GraficoEvolucao
      titulo="Total investido"
      subtitulo={`Aportes acumulados nos últimos ${dados.length} meses`}
      dados={dados}
      altura={altura}
      acoes={acoes}
    />
  );
}

export default GraficoInvestimento;
