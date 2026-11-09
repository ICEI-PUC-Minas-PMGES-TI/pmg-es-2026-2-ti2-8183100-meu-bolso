import { formatarMoeda } from "../../utils/Receitasutils";
import IconeCategoria from "./IconeCategoria";
import styles from "../../pages/Receitas/Receitas.module.css";

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
        className={`${styles["receitas-card"]} ${styles["receitas-esqueleto"]}`}
        style={{ minHeight: 230 }}
        aria-busy="true"
      />
    );
  }

  return (
    <section className={`${styles["receitas-card"]} ${styles["receitas-distribuicao"]}`}>
      <div className={styles["receitas-painel-cabecalho"]}>
        <div>
          <h2 className={styles["receitas-painel-titulo"]}>Receitas por categoria</h2>
          {itens.length > 0 && (
            <p className={styles["receitas-painel-legenda"]}>
              Toque em uma categoria para filtrar a lista.
            </p>
          )}
        </div>
      </div>

      {itens.length === 0 ? (
        <div className={styles["receitas-painel-vazio"]}>
          <p>As receitas do mês aparecem aqui, agrupadas por categoria.</p>
        </div>
      ) : (
        <ul className={styles["receitas-distribuicao-lista"]}>
          {itens.map((item, indice) => {
            const ativa = selecionada === item.categoria;

            return (
              <li key={item.categoria}>
                <button
                  type="button"
                  className={`${styles["receitas-distribuicao-item"]} ${
                    indice === 0 ? styles["receitas-distribuicao-lider"] : ""
                  }`}
                  aria-pressed={ativa}
                  onClick={() => onSelecionar(ativa ? "" : item.categoria)}
                >
                  <span className={styles["receitas-distribuicao-icone"]}>
                    <IconeCategoria categoria={item.categoria} />
                  </span>

                  <span className={styles["receitas-distribuicao-meio"]}>
                    <span className={styles["receitas-distribuicao-nome"]}>
                      {item.categoria}
                      <span className={styles["receitas-distribuicao-qtd"]}>
                        {item.quantidade} {item.quantidade === 1 ? "receita" : "receitas"}
                      </span>
                    </span>

                    <span className={styles["receitas-barra-trilho"]} aria-hidden="true">
                      <span
                        className={styles["receitas-barra-preenchimento"]}
                        style={{ "--p": item.percentual / 100 }}
                      />
                    </span>
                  </span>

                  <span className={styles["receitas-distribuicao-numeros"]}>
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
