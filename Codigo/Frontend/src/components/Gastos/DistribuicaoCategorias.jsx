    import { formatarMoeda } from "../../utils/Gastosutils";
    import IconeCategoria from "./IconeCategoria";
    import styles from "../../pages/Gastos/Gastos.module.css";

    function formatarPercentual(valor) {
    return valor > 0 && valor < 1 ? "<1%" : `${Math.round(valor)}%`;
    }

    export default function DistribuicaoCategorias({
    itens,
    selecionada,
    onSelecionar,
    carregando,
    }) {
    if (carregando) {
        return (
        <div
            className={`${styles["gastos-card"]} ${styles["gastos-esqueleto"]}`}
            style={{ minHeight: 230 }}
            aria-busy="true"
        />
        );
    }

    return (
        <section className={`${styles["gastos-card"]} ${styles["gastos-distribuicao"]}`}>
        <div className={styles["gastos-painel-cabecalho"]}>
            <div>
            <h2 className={styles["gastos-painel-titulo"]}>Gastos por categoria</h2>
            {itens.length > 0 && (
                <p className={styles["gastos-painel-legenda"]}>
                Toque em uma categoria para filtrar a lista.
                </p>
            )}
            </div>
        </div>

        {itens.length === 0 ? (
            <div className={styles["gastos-painel-vazio"]}>
            <p>Os gastos do mês aparecem aqui, agrupados por categoria.</p>
            </div>
        ) : (
            <ul className={styles["gastos-distribuicao-lista"]}>
            {itens.map((item, indice) => {
                const ativa = selecionada === item.categoria;

                return (
                <li key={item.categoria}>
                    <button
                    type="button"
                    className={`${styles["gastos-distribuicao-item"]} ${
                        indice === 0 ? styles["gastos-distribuicao-lider"] : ""
                    }`}
                    aria-pressed={ativa}
                    onClick={() => onSelecionar(ativa ? "" : item.categoria)}
                    >
                    <span className={styles["gastos-distribuicao-icone"]}>
                        <IconeCategoria categoria={item.categoria} />
                    </span>

                    <span className={styles["gastos-distribuicao-meio"]}>
                        <span className={styles["gastos-distribuicao-nome"]}>
                        {item.categoria}
                        <span className={styles["gastos-distribuicao-qtd"]}>
                            {item.quantidade} {item.quantidade === 1 ? "gasto" : "gastos"}
                        </span>
                        </span>

                        <span className={styles["gastos-barra-trilho"]} aria-hidden="true">
                        <span
                            className={styles["gastos-barra-preenchimento"]}
                            style={{ "--p": item.percentual / 100 }}
                        />
                        </span>
                    </span>

                    <span className={styles["gastos-distribuicao-numeros"]}>
                        <strong>{formatarPercentual(item.percentual)}</strong>
                        <span>{formatarMoeda(item.total)}</span>
                    </span>
                    </button>
                </li>
                );
            })}
            </ul>
        )}
        </section>
    );
    }