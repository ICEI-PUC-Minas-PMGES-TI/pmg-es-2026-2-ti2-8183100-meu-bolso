import styles from "./Cartao.module.css";

/**
 * Cartão visual (carteira tipo "cartao"). Apenas estético.
 * Mostra sempre a frente (sem virar). Titular e validade são
 * opcionais: só aparecem quando estiverem cadastrados.
 *
 * props:
 *  - apelido, bandeira, ultimosDigitos
 *  - titular, validade (opcionais)
 *  - tema: "roxo" | "escuro" | "verde" | "azul"
 *  - compacto: versão reduzida (topo do painel)
 */
function Cartao({
  titular = "",
  ultimosDigitos = "",
  validade = "",
  bandeira = "",
  apelido = "",
  tema = "roxo",
  subtipo = "",
  compacto = false,
}) {
  // Representação compacta (topo do painel): só o essencial para
  // identificar o cartão — tipo, bandeira (se houver) e 4 dígitos.
  if (compacto) {
    const rotuloTipo =
      subtipo === "debito"
        ? "Débito"
        : subtipo === "credito"
        ? "Crédito"
        : "";

    return (
      <div className={`${styles.cena} ${styles.compacto}`}>
        <div className={`${styles.cartao} ${styles[`tema-${tema}`]}`}>
          <div className={`${styles.face} ${styles.frente}`}>
            <div className={styles.topo}>
              {rotuloTipo && <span className={styles.apelido}>{rotuloTipo}</span>}
              {bandeira && <span className={styles.bandeira}>{bandeira}</span>}
            </div>

            <div className={styles.numero}>
              <span>••••</span>
              <span>{ultimosDigitos || "••••"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cena}>
      <div className={`${styles.cartao} ${styles[`tema-${tema}`]}`}>
        {/* FRENTE */}
        <div className={`${styles.face} ${styles.frente}`}>
          <div className={styles.topo}>
            <span className={styles.apelido}>{apelido || "Meu Bolso"}</span>
            {bandeira && <span className={styles.bandeira}>{bandeira}</span>}
          </div>

          <div className={styles.chip} aria-hidden="true" />

          <div className={styles.numero}>
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span>{ultimosDigitos || "••••"}</span>
          </div>

          {(titular || validade) && (
            <div className={styles.rodape}>
              {titular && (
                <div className={styles.campo}>
                  <small>Titular</small>
                  <strong>{titular.toUpperCase()}</strong>
                </div>
              )}
              {validade && (
                <div className={styles.campo}>
                  <small>Validade</small>
                  <strong>{validade}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cartao;
