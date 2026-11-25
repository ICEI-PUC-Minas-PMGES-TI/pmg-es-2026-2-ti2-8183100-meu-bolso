import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";

import { formatarMoeda, formatarMesExtenso } from "../../utils/Gastosutils";
import g from "../../pages/Gastos/Gastos.module.css";
import styles from "../../pages/Movimentacoes/Movimentacoes.module.css";

function plural(quantidade, singular, formaPlural) {
  return quantidade === 1 ? singular : formaPlural;
}

function comSinal(valor) {
  if (valor > 0) return `+ ${formatarMoeda(valor)}`;
  if (valor < 0) return `− ${formatarMoeda(Math.abs(valor))}`;
  return formatarMoeda(0);
}

/**
 * Os detalhes que antes ficavam nos 4 cards de Gastos e nos 4 de Receitas
 * (maior lançamento, média por dia, quantidade e média por lançamento)
 * continuam aqui, como linhas dentro dos cards de Entradas e Saídas.
 */
function Detalhes({ resumo, singular, formaPlural, vazio }) {
  const { quantidade, maior, mediaDiaria, diasBase, ehMesAtual, ticketMedio } = resumo;

  if (!quantidade) {
    return <p className={styles["resumo-vazio"]}>{vazio}</p>;
  }

  return (
    <dl className={styles["resumo-detalhes"]}>
      <div>
        <dt>Quantidade</dt>
        <dd>
          {quantidade} {plural(quantidade, singular, formaPlural)} · {formatarMoeda(ticketMedio)} em
          média
        </dd>
      </div>
      <div>
        <dt>Maior</dt>
        <dd title={maior?.descricao}>
          {formatarMoeda(maior.valor)} · {maior.descricao}
        </dd>
      </div>
      <div>
        <dt>Média por dia</dt>
        <dd>
          {formatarMoeda(mediaDiaria)}{" "}
          {ehMesAtual
            ? `nos ${diasBase} ${plural(diasBase, "dia", "dias")} até hoje`
            : `em ${diasBase} dias`}
        </dd>
      </div>
    </dl>
  );
}

export default function ResumoMovimentacoes({
  resumoGastos,
  resumoReceitas,
  saldo,
  mesSelecionado,
  carregando,
}) {
  if (carregando) {
    return (
      <section className={styles.resumo} aria-label="Resumo do mês" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${g["gastos-resumo-card"]} ${g["gastos-esqueleto"]}`}
            style={{ minHeight: 180 }}
          />
        ))}
      </section>
    );
  }

  return (
    <section className={styles.resumo} aria-label="Resumo do mês">
      <div className={g["gastos-resumo-card"]} style={{ "--i": 0 }}>
        <span className={`${g["gastos-resumo-icone"]} ${styles["icone-entrada"]}`}>
          <ArrowDownLeft size={18} aria-hidden="true" />
        </span>
        <p className={g["gastos-resumo-rotulo"]}>Entradas</p>
        <strong className={`${g["gastos-resumo-valor"]} ${styles["valor-entrada"]}`}>
          {formatarMoeda(resumoReceitas.total)}
        </strong>
        <Detalhes
          resumo={resumoReceitas}
          singular="receita"
          formaPlural="receitas"
          vazio="Nenhuma receita neste mês"
        />
      </div>

      <div className={g["gastos-resumo-card"]} style={{ "--i": 1 }}>
        <span className={`${g["gastos-resumo-icone"]} ${styles["icone-saida"]}`}>
          <ArrowUpRight size={18} aria-hidden="true" />
        </span>
        <p className={g["gastos-resumo-rotulo"]}>Saídas</p>
        <strong className={g["gastos-resumo-valor"]}>{formatarMoeda(resumoGastos.total)}</strong>
        <Detalhes
          resumo={resumoGastos}
          singular="gasto"
          formaPlural="gastos"
          vazio="Nenhum gasto neste mês"
        />
      </div>

      <div className={`${g["gastos-resumo-card"]} ${styles["resumo-saldo"]}`} style={{ "--i": 2 }}>
        <span className={`${g["gastos-resumo-icone"]} ${styles["icone-saldo"]}`}>
          <Scale size={18} aria-hidden="true" />
        </span>
        <p className={g["gastos-resumo-rotulo"]}>Saldo do mês</p>
        <strong className={g["gastos-resumo-valor"]}>{comSinal(saldo.total)}</strong>
        <p className={g["gastos-resumo-detalhe"]}>{formatarMesExtenso(mesSelecionado)}</p>
        {saldo.temPrevistos && (
          <p className={styles["resumo-previsto"]}>
            Inclui lançamentos previstos. Só o que já aconteceu: {comSinal(saldo.semPrevistos)}
          </p>
        )}
      </div>
    </section>
  );
}
