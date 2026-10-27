    import { CircleCheck, TriangleAlert, OctagonAlert, Pencil, PiggyBank } from "lucide-react";

    import { formatarMoeda } from "../../utils/Gastosutils";
    import styles from "../../pages/Gastos/Gastos.module.css";

    const MENSAGENS = {
    ok: { Icone: CircleCheck, texto: "Tudo certo: você está abaixo de 70% do orçamento." },
    atencao: { Icone: TriangleAlert, texto: "Atenção: você já passou de 70% do orçamento." },
    critico: { Icone: OctagonAlert, texto: "Cuidado: mais de 90% do orçamento já foi usado." },
    estourado: { Icone: OctagonAlert, texto: "Orçamento ultrapassado neste mês." },
    };

    export default function StatusOrcamento({
    totalGasto,
    orcamento,
    status,
    carregando,
    onEditar,
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

    // Ainda sem orçamento definido
    if (!status) {
        return (
        <section className={`${styles["gastos-card"]} ${styles["gastos-orcamento"]}`}>
            <h2 className={styles["gastos-painel-titulo"]}>Orçamento do mês</h2>

            <div className={styles["gastos-painel-vazio"]}>
            <PiggyBank size={28} aria-hidden="true" />
            <p>Defina quanto quer gastar por mês e acompanhe o consumo aqui.</p>
            <button type="button" className="btn btn-primario" onClick={onEditar}>
                Definir orçamento
            </button>
            </div>
        </section>
        );
    }

    const { percentual, restante, nivel, estourado } = status;
    const chaveMensagem = estourado ? "estourado" : nivel;
    const { Icone, texto } = MENSAGENS[chaveMensagem];
    const preenchimento = Math.min(percentual, 100) / 100;

    return (
        <section
        className={`${styles["gastos-card"]} ${styles["gastos-orcamento"]} ${
            styles[`gastos-orcamento-${nivel}`]
        }`}
        >
        <div className={styles["gastos-painel-cabecalho"]}>
            <h2 className={styles["gastos-painel-titulo"]}>Orçamento do mês</h2>

            <button
            type="button"
            className={styles["gastos-botao-icone"]}
            onClick={onEditar}
            aria-label="Editar orçamento mensal"
            title="Editar orçamento"
            >
            <Pencil size={16} aria-hidden="true" />
            </button>
        </div>

        <p className={styles["gastos-orcamento-percentual"]}>
            {Math.round(percentual)}%
            <span className={styles["gastos-orcamento-percentual-legenda"]}>
            {" "}
            do orçamento usado
            </span>
        </p>

        <div
            className={styles["gastos-barra-trilho"]}
            role="progressbar"
            aria-label="Orçamento utilizado"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(Math.round(percentual), 100)}
            aria-valuetext={`${Math.round(percentual)}% do orçamento usado`}
        >
            <div
            className={styles["gastos-barra-preenchimento"]}
            style={{ "--p": preenchimento }}
            />
            {/* Marcas dos limites de aviso (70% e 90%) */}
            <span
            className={styles["gastos-barra-marca"]}
            style={{ left: "70%" }}
            aria-hidden="true"
            />
            <span
            className={styles["gastos-barra-marca"]}
            style={{ left: "90%" }}
            aria-hidden="true"
            />
        </div>

        <dl className={styles["gastos-orcamento-valores"]}>
            <div>
            <dt>Gasto</dt>
            <dd>{formatarMoeda(totalGasto)}</dd>
            </div>
            <div>
            <dt>Orçamento</dt>
            <dd>{formatarMoeda(orcamento)}</dd>
            </div>
            <div>
            <dt>{estourado ? "Excedido em" : "Restante"}</dt>
            <dd className={styles["gastos-orcamento-restante"]}>
                {formatarMoeda(Math.abs(restante))}
            </dd>
            </div>
        </dl>

        <p className={styles["gastos-orcamento-aviso"]} role="status">
            <Icone size={18} aria-hidden="true" />
            <span>{texto}</span>
        </p>
        </section>
    );
    }