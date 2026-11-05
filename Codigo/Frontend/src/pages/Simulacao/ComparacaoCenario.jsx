import { ArrowRight } from "lucide-react";

import styles from "./Simulacao.module.css";
import { formatarMoeda } from "./calculoSimulacao";

// Legenda abaixo do valor "depois", conforme o estado da simulação.
function legendaDepois(resultado) {
  if (!resultado) return "Aguardando simulação";
  if (resultado.parcelado) {
    return `${resultado.nParcelas}x de ${formatarMoeda(resultado.valorParcela)}`;
  }
  return "Pagamento à vista";
}

// Card "Comparação do cenário": saldo antes x depois da compra.
function ComparacaoCenario({ saldoAtual, resultado }) {
  return (
    <div className={`card ${styles.comparacao}`}>
      <h3>Comparação do cenário</h3>

      <div className={styles.cenario}>
        <div className={styles.cenarioBloco}>
          <span className={styles.cenarioRotulo}>Antes da compra</span>
          <strong className={styles.cenarioValor}>
            {formatarMoeda(saldoAtual)}
          </strong>
          <span className="texto-secundario texto-pequeno">
            Saldo da carteira
          </span>
        </div>

        <ArrowRight size={20} className={styles.cenarioSeta} aria-hidden="true" />

        <div className={styles.cenarioBloco}>
          <span className={styles.cenarioRotulo}>Depois da compra</span>
          <strong
            className={`${styles.cenarioValor} ${
              resultado?.saldoNegativo ? styles.valorNegativo : ""
            }`}
          >
            {resultado ? formatarMoeda(resultado.saldoDepois) : "—"}
          </strong>
          <span className="texto-secundario texto-pequeno">
            {legendaDepois(resultado)}
          </span>
        </div>
      </div>

      {resultado?.saldoNegativo && (
        <p className={`mensagem mensagem-alerta ${styles.aviso}`}>
          Essa compra deixa o saldo da carteira negativo.
        </p>
      )}
    </div>
  );
}

export default ComparacaoCenario;
