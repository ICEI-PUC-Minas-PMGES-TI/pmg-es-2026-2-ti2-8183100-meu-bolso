import {
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import styles from "./CardsResumo.module.css";
import { formatarReal } from "./formatacao";

// ============================================================
// CARDS DE RESUMO (topo do Dashboard)
// ------------------------------------------------------------
// Quatro indicadores derivados dos dados já carregados pela
// Evolução Financeira (sem novas chamadas à API). Só o realizado:
// nada de lançamentos previstos/futuros. Cada card mostra a
// variação percentual em relação ao fim do mês anterior.
// ============================================================

// Variação percentual sem casas decimais. Null quando não há base de
// comparação (anterior 0 ou ausente), para esconder o selo.
function calcularVariacao(atual, anterior) {
  if (!anterior) return null;
  return Math.round(((atual - anterior) / Math.abs(anterior)) * 100);
}

// Selo da variação. `altaBoa` diz se subir é positivo (verde) ou negativo
// (vermelho): nos gastos é o contrário dos demais. 0% fica cinza, sem seta.
function SeloVariacao({ variacao, altaBoa }) {
  if (variacao === null) return null;

  if (variacao === 0) {
    return <span className={`${styles.selo} ${styles.seloNeutro}`}>0%</span>;
  }

  const subiu = variacao > 0;
  const bom = subiu === altaBoa;
  const Seta = subiu ? ArrowUp : ArrowDown;

  return (
    <span className={`${styles.selo} ${bom ? styles.seloBom : styles.seloRuim}`}>
      <Seta size={12} aria-hidden="true" />
      {Math.abs(variacao)}%
    </span>
  );
}

function CardsResumo({ resumo }) {
  const cards = [
    {
      rotulo: "Saldo atual",
      valor: resumo.saldoAtual,
      anterior: resumo.saldoAnterior,
      Icone: Wallet,
      altaBoa: true,
    },
    {
      rotulo: "Guardado",
      valor: resumo.guardado,
      anterior: resumo.guardadoAnterior,
      Icone: PiggyBank,
      altaBoa: true,
    },
    {
      rotulo: "Receitas do mês",
      valor: resumo.receitasMes,
      anterior: resumo.receitasAnterior,
      Icone: TrendingUp,
      altaBoa: true,
    },
    {
      rotulo: "Gastos do mês",
      valor: resumo.gastosMes,
      anterior: resumo.gastosAnterior,
      Icone: TrendingDown,
      altaBoa: false,
    },
  ];

  return (
    <div className={styles.grade}>
      {cards.map(({ rotulo, valor, anterior, Icone, altaBoa }) => {
        const variacao = calcularVariacao(valor, anterior);
        return (
          <div key={rotulo} className={`card ${styles.card}`}>
            <div className={styles.topo}>
              <span className={styles.rotulo}>{rotulo}</span>
              <Icone size={18} className={styles.icone} aria-hidden="true" />
            </div>
            <div className={styles.valorLinha}>
              <span className={styles.valor}>{formatarReal(valor)}</span>
              <SeloVariacao variacao={variacao} altaBoa={altaBoa} />
            </div>
            {variacao !== null && (
              <span className={styles.comparacao}>vs. mês anterior</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CardsResumo;
