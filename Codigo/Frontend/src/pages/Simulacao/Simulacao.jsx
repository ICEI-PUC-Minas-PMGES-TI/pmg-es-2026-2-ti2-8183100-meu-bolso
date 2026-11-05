import styles from "./Simulacao.module.css";
import { useDadosSimulacao } from "./useDadosSimulacao";
import EstadoCard from "./EstadoCard";

// ============================================================
// SIMULAÇÃO (RF-08 — Planejamento / Simulação)
// ------------------------------------------------------------
// Simula o impacto de uma compra (à vista ou parcelada) no saldo
// e nas metas do usuário. O cálculo é feito em memória — nada é
// persistido.
// ============================================================

function Simulacao() {
  const { carteiras, metas, carregando, erro } = useDadosSimulacao();

  return (
    <div className={styles.simulacao}>
      <div className={styles.cabecalho}>
        <h1>Simulador de compras</h1>
        <p className="texto-secundario">
          Entenda o impacto de uma compra antes de decidir.
        </p>
      </div>

      {carregando || erro ? (
        <EstadoCard erro={erro} />
      ) : (
        <p className="texto-secundario">
          {carteiras.length} carteira(s) e {metas.length} meta(s) carregadas.
        </p>
      )}
    </div>
  );
}

export default Simulacao;
