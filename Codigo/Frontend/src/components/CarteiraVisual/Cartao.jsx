import { bancoDe, corTexto, fundoCartao } from "../../data/bancos";
import styles from "./Cartao.module.css";

/** Normaliza o nome do cartão para a chave do mapa de bancos.
 *  "Banco Inter" -> "inter", "Nubank" -> "nubank". */
function chaveBancoCartao(apelido) {
  return (apelido || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^banco\s+/, "")
    .replace(/\s+/g, "");
}

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
  // Identidade visual do banco (fundo, cor do texto e logo).
  const banco = bancoDe(chaveBancoCartao(apelido));
  const corDoTexto = corTexto(banco.cor);
  const estiloFace = {
    background: fundoCartao(banco.cor),
    color: corDoTexto,
  };
  // Logo branca quando o texto é branco (fundo escuro/colorido).
  const estiloLogo =
    corDoTexto === "#FFFFFF" ? { filter: "brightness(0) invert(1)" } : undefined;

  function aoErrarLogo(e) {
    if (!e.currentTarget.dataset.fallback) {
      e.currentTarget.dataset.fallback = "1";
      e.currentTarget.src = "/bancos/padrao.png";
    }
  }

  const logoImg = (
    <img
      src={banco.logo}
      alt={banco.nome}
      className={styles.logo}
      style={estiloLogo}
      onError={aoErrarLogo}
    />
  );

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
          <div className={`${styles.face} ${styles.frente}`} style={estiloFace}>
            <div className={styles.topo}>
              <span className={styles.marca}>
                {logoImg}
                {rotuloTipo && <span className={styles.apelido}>{rotuloTipo}</span>}
              </span>
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
        <div className={`${styles.face} ${styles.frente}`} style={estiloFace}>
          <div className={styles.topo}>
            <span className={styles.marca}>
              {logoImg}
              <span className={styles.apelido}>{apelido || "Meu Bolso"}</span>
            </span>
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
