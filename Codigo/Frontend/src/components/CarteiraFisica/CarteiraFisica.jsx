import { useState, Children } from "react";
import corpo from "/images/carteira_corpo.png";
import bolso from "/images/carteira_bolso.png";
import styles from "./CarteiraFisica.module.css";

/**
 * Porta-cartões físico em camadas:
 *   1. imagem do CORPO (fundo)         — decorativa, pointer-events: none
 *   2. cartões HTML (children)         — clicáveis, entre as duas imagens
 *   3. imagem do BOLSO (frente)        — decorativa, cobre a base dos cartões
 *
 * As duas imagens têm a mesma dimensão (603x414), então ocupam o mesmo box.
 *
 * Interação (idêntica à anterior):
 *  - hover abre; clique alterna (touch); foco por teclado abre (focus-within)
 *  - `manterAberta` impede fechar enquanto houver cartão selecionado (painel)
 *
 * props:
 *  - manterAberta: boolean
 *  - children: cartões (ItemCarteira)
 */
function CarteiraFisica({ manterAberta = false, children }) {
  const [aberta, setAberta] = useState(false);
  const revelada = aberta || manterAberta;

  const cartoes = Children.toArray(children);
  const total = cartoes.length;

  return (
    <div
      className={`${styles.cena} ${revelada ? styles.aberta : ""}`}
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={() => setAberta(false)}
      onClick={() => setAberta((v) => !v)}
    >
      {/* Camada 1: corpo da carteira (fundo) */}
      <img
        className={styles.corpo}
        src={corpo}
        alt=""
        aria-hidden="true"
        draggable="false"
      />

      {/* Camada 2: cartões HTML reais, entre o corpo e o bolso.
          Cada cartão recebe seu índice (--i) e o total (--n) para o CSS
          calcular o leque de forma adaptável ao número de cartões. */}
      <div className={styles.leque} style={{ "--n": total }}>
        {cartoes.map((cartao, i) => (
          <div key={cartao.key ?? i} className={styles.slot} style={{ "--i": i }}>
            {cartao}
          </div>
        ))}
      </div>

      {/* Camada 3: bolso frontal (cobre a base dos cartões) */}
      <img
        className={styles.bolso}
        src={bolso}
        alt=""
        aria-hidden="true"
        draggable="false"
      />
    </div>
  );
}

export default CarteiraFisica;
