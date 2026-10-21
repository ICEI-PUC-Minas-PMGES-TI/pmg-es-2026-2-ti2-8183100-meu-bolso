import styles from "./Cedula.module.css";

/**
 * Cédula de dinheiro (representa a carteira do tipo "dinheiro/espécie").
 * Apenas visual; dados estáticos.
 *
 * props:
 *  - apelido: rótulo (ex: "Dinheiro na carteira")
 *  - valor: valor exibido (ex: "R$ 180,00")
 */
function Cedula({ apelido = "Dinheiro", valor = "R$ 0,00", compacto = false }) {
  return (
    <div className={`${styles.cena} ${compacto ? styles.compacto : ""}`}>
      <div className={styles.cedula}>
        {/* brilho/relevo */}
        <div className={styles.guilhoche} aria-hidden="true" />

        {/* selo central (estilo "retrato" das notas) */}
        <div className={styles.selo} aria-hidden="true">
          <span className={styles.cifrao}>R$</span>
        </div>

        {/* cantos com o valor, como numa nota real */}
        <span className={`${styles.canto} ${styles.cantoTopo}`}>{valor}</span>
        <span className={`${styles.canto} ${styles.cantoBaixo}`}>{valor}</span>

        {/* faixa inferior com o apelido */}
        <div className={styles.faixa}>
          <span className={styles.apelido}>{apelido}</span>
          <span className={styles.marca}>MEU BOLSO</span>
        </div>
      </div>
    </div>
  );
}

export default Cedula;
