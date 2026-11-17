import { ChartLine, ChartColumnBig, PiggyBank } from "lucide-react";

import styles from "./EvolucaoFinanceira.module.css";

// Opções do seletor (dados → menos JSX repetido).
const OPCOES = [
  {
    valor: "mensal",
    Icone: ChartColumnBig,
    rotulo: "Gráfico de barras (gastos e renda)",
    titulo: "Gastos e renda",
  },
  {
    valor: "acumulado",
    Icone: ChartLine,
    rotulo: "Gráfico de linha (saldo acumulado)",
    titulo: "Saldo acumulado",
  },
  {
    valor: "investimento",
    Icone: PiggyBank,
    rotulo: "Gráfico de investimentos",
    titulo: "Investimentos",
  },
];

// Seletor de gráfico com ícones (fica no canto superior direito do card).
function SeletorGrafico({ ativo, aoMudar }) {
  return (
    <div
      className={styles.seletor}
      role="tablist"
      aria-label="Escolha o gráfico"
    >
      {OPCOES.map(({ valor, Icone, rotulo, titulo }) => (
        <button
          key={valor}
          type="button"
          role="tab"
          aria-selected={ativo === valor}
          aria-label={rotulo}
          title={titulo}
          className={`${styles.seletorBotao} ${
            ativo === valor ? styles.seletorBotaoAtivo : ""
          }`}
          onClick={() => aoMudar(valor)}
        >
          <Icone size={18} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export default SeletorGrafico;
