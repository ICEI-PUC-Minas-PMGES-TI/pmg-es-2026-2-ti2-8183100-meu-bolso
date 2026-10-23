import {
  bancoDe,
  chaveDoBanco,
  corTexto,
  fundoCartao,
  filtroLogo,
  LOGO_ICONE,
} from "../../data/bancos";
import styles from "./Cartao.module.css";

/**
 * Cartão visual (carteira tipo "cartao"). Apenas estético.
 * Mostra sempre a frente (sem virar). Titular e validade são
 * opcionais: só aparecem quando estiverem cadastrados.
 *
 * props:
 *  - apelido, bandeira, ultimosDigitos
 *  - banco (opcional): nome do banco/conta associada
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
  banco: bancoTexto = "",
  tema = "roxo",
  subtipo = "",
  compacto = false,
}) {
  // Resolve a chave do banco:
  //  1) chave salva no cartão (bancoTexto), se for um banco válido;
  //  2) "outro" (ou inválida) -> padrao;
  //  3) cartões antigos sem banco -> deduz do nome do cartão.
  const chaveSalva = bancoTexto ? chaveDoBanco(bancoTexto) : null;
  const chave =
    chaveSalva ?? (bancoTexto ? null : chaveDoBanco(apelido));
  const banco = bancoDe(chave);
  const bancoReconhecido = chave != null;
  const corDoTexto = corTexto(banco.cor);
  // Ícones opacos (quadrado colorido): cores originais, cantos e anel branco.
  // Demais bancos: filtro de contraste. Nunca aplica no padrao.png.
  const ehIcone = bancoReconhecido && LOGO_ICONE.has(chave);
  const estiloLogo = !bancoReconhecido
    ? undefined
    : ehIcone
    ? { borderRadius: "6px", boxShadow: "0 0 0 2px rgba(255,255,255,.9)" }
    : { filter: filtroLogo(banco.cor) };
  const estiloFace = {
    background: fundoCartao(banco.cor),
    color: corDoTexto,
  };
  function aoErrarLogo(e) {
    if (!e.currentTarget.dataset.fallback) {
      e.currentTarget.dataset.fallback = "1";
      e.currentTarget.src = "/bancos/padrao.png";
    }
  }

  // Caixa de tamanho fixo padroniza todas as logos (independe do recorte do PNG).
  const logoImg = (
    <span className={styles.logoBox}>
      <img
        src={banco.logo}
        alt={banco.nome}
        className={styles.logo}
        style={estiloLogo}
        onError={aoErrarLogo}
      />
    </span>
  );

  // Representação compacta (topo do painel): só o essencial para
  // identificar o cartão — tipo, bandeira (se houver) e 4 dígitos.
  if (compacto) {
    return (
      <div className={`${styles.cena} ${styles.compacto}`}>
        <div className={`${styles.cartao} ${styles[`tema-${tema}`]}`}>
          <div className={`${styles.face} ${styles.frente}`} style={estiloFace}>
            <div className={styles.topo}>
              <span className={styles.marca}>{logoImg}</span>
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
            <span className={styles.marca}>{logoImg}</span>
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

export default Cartao;
