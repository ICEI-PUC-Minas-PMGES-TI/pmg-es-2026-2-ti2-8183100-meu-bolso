    import { Wallet, TrendingUp, CalendarDays, Receipt } from "lucide-react";

    import { formatarMoeda, formatarMesExtenso } from "../../utils/Gastosutils";
    import styles from "../../pages/Gastos/Gastos.module.css";

    function plural(quantidade, singular, formaPlural) {
    return quantidade === 1 ? singular : formaPlural;
    }

    export default function ResumoCards({ resumo, mesSelecionado, carregando }) {
    if (carregando) {
        return (
        <section
            className={styles["gastos-resumo"]}
            aria-label="Resumo do mês"
            aria-busy="true"
        >
            {[0, 1, 2, 3].map((i) => (
            <div
                key={i}
                className={`${styles["gastos-resumo-card"]} ${styles["gastos-esqueleto"]}`}
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
        rotulo: "Total gasto no mês",
        valor: formatarMoeda(total),
        detalhe: formatarMesExtenso(mesSelecionado),
        destaque: true,
        },
        {
        chave: "maior",
        Icone: TrendingUp,
        rotulo: "Maior gasto do mês",
        valor: maior ? formatarMoeda(maior.valor) : "—",
        detalhe: maior ? maior.descricao : "Nenhum gasto neste mês",
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
        rotulo: "Quantidade de gastos",
        valor: String(quantidade),
        detalhe: quantidade ? `${formatarMoeda(ticketMedio)} em média` : "Nada lançado ainda",
        },
    ];

    return (
        <section className={styles["gastos-resumo"]} aria-label="Resumo do mês">
        {cards.map(({ chave, Icone, rotulo, valor, detalhe, destaque }, indice) => (
            <div
            key={chave}
            className={`${styles["gastos-resumo-card"]} ${
                destaque ? styles["gastos-resumo-destaque"] : ""
            }`}
            style={{ "--i": indice }}
            >
            <span className={styles["gastos-resumo-icone"]}>
                <Icone size={18} aria-hidden="true" />
            </span>

            <p className={styles["gastos-resumo-rotulo"]}>{rotulo}</p>
            <strong className={styles["gastos-resumo-valor"]}>{valor}</strong>
            <p className={styles["gastos-resumo-detalhe"]} title={detalhe}>
                {detalhe}
            </p>
            </div>
        ))}
        </section>
    );
    }