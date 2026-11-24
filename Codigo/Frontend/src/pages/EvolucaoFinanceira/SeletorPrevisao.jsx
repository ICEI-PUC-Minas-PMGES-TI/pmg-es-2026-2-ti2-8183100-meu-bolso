import styles from "./EvolucaoFinanceira.module.css";
import { OPCOES_PREVISAO } from "./dados";

// Filtro do horizonte da prospecção (3 meses, 6 meses ou 1 ano).
// Mesmo visual do SeletorGrafico, com texto no lugar dos ícones.
function SeletorPrevisao({ meses, aoMudar }) {
  return (
    <div
      className={styles.seletor}
      role="radiogroup"
      aria-label="Período da previsão"
    >
      {OPCOES_PREVISAO.map((opcao) => (
        <button
          key={opcao.meses}
          type="button"
          role="radio"
          aria-checked={meses === opcao.meses}
          title={`Previsão para os próximos ${opcao.rotulo}`}
          className={`${styles.seletorBotao} ${styles.seletorTexto} ${
            meses === opcao.meses ? styles.seletorBotaoAtivo : ""
          }`}
          onClick={() => aoMudar(opcao.meses)}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}

export default SeletorPrevisao;
