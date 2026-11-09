import { Wallet, TrendingUp, CalendarDays, Receipt } from "lucide-react";

import { formatarMoeda, formatarMesExtenso } from "../../utils/Receitasutils";
import styles from "../../pages/Receitas/Receitas.module.css";

function plural(quantidade, singular, formaPlural) {
  return quantidade === 1 ? singular : formaPlural;
}

export default function ResumoCards({ resumo, mesSelecionado, carregando }) {
  if (carregando) {
    return (
      <section
        className={styles["receitas-resumo"]}
        aria-label="Resumo do mês"
        aria-busy="true"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`${styles["receitas-resumo-card"]} ${styles["receitas-esqueleto"]}`}
            style={{ minHeight: 112 }}
          />
        ))}
      </section>
    );
  }

  const { total, quantidade, maior, mediaDiaria, diasBase, ehMesAtual, ticketMedio } =
    resumo;

  const cards = [
    {
      chave: "total",
      Icone: Wallet,
      rotulo: "Total recebido no mês",
      valor: formatarMoeda(total),
      detalhe: formatarMesExtenso(mesSelecionado),
      destaque: true,
    },
    {
      chave: "maior",
      Icone: TrendingUp,
      rotulo: "Maior receita do mês",
      valor: maior ? formatarMoeda(maior.valor) : "—",
      detalhe: maior ? maior.descricao : "Nenhuma receita neste mês",
    },
    {
      chave: "media",
      Icone: CalendarDays,
      rotulo: "Média por dia",
      valor: formatarMoeda(mediaDiaria),
      detalhe: ehMesAtual
        ? `nos ${diasBase} ${plural(diasBase, "dia", "dias")} até hoje`
        : `em ${diasBase} dias`,
    },
    {
      chave: "quantidade",
      Icone: Receipt,
      rotulo: "Quantidade de receitas",
      valor: String(quantidade),
      detalhe: quantidade ? `${formatarMoeda(ticketMedio)} em média` : "Nada lançado ainda",
    },
  ];

  return (
    <section className={styles["receitas-resumo"]} aria-label="Resumo do mês">
      {cards.map(({ chave, Icone, rotulo, valor, detalhe, destaque }, indice) => (
        <div
          key={chave}
          className={`${styles["receitas-resumo-card"]} ${
            destaque ? styles["receitas-resumo-destaque"] : ""
          }`}
          style={{ "--i": indice }}
        >
          <span className={styles["receitas-resumo-icone"]}>
            <Icone size={18} aria-hidden="true" />
          </span>

          <p className={styles["receitas-resumo-rotulo"]}>{rotulo}</p>
          <strong className={styles["receitas-resumo-valor"]}>{valor}</strong>
          <p className={styles["receitas-resumo-detalhe"]} title={detalhe}>
            {detalhe}
          </p>
        </div>
      ))}
    </section>
  );
}
