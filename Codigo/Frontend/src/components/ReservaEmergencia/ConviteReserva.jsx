import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { CONVITE_TEXTO, CONVITE_TITULO } from "./reserva";
import styles from "./ReservaEmergencia.module.css";

// "Agora não" só recolhe o convite numa faixa; a escolha fica no navegador
// (preferência de tela, não é dado financeiro).
const CHAVE_ADIADO = "meubolso:reserva:convite-recolhido";

function lerRecolhido() {
  try {
    return localStorage.getItem(CHAVE_ADIADO) === "1";
  } catch {
    return false;
  }
}

/**
 * Convite para configurar a reserva de emergência. Aparece no topo de Metas
 * enquanto o usuário não tem uma reserva. "Agora não" recolhe o card numa
 * faixa fina, que continua visível.
 *
 * props:
 *  - onConfigurar: abre o modal de configuração
 */
function ConviteReserva({ onConfigurar }) {
  const [recolhido, setRecolhido] = useState(lerRecolhido);

  function mudar(valor) {
    setRecolhido(valor);
    try {
      if (valor) localStorage.setItem(CHAVE_ADIADO, "1");
      else localStorage.removeItem(CHAVE_ADIADO);
    } catch {
      // Sem localStorage: vale só nesta visita.
    }
  }

  if (recolhido) {
    return (
      <div className={styles.faixa}>
        <span>Sua reserva de emergência ainda não foi configurada.</span>
        <button type="button" className={styles.linkBotao} onClick={onConfigurar}>
          Configurar agora
        </button>
      </div>
    );
  }

  return (
    <section className={styles.convite} aria-labelledby="convite-reserva-titulo">
      <span className={`${styles.icone} ${styles.conviteIcone}`} aria-hidden="true">
        <ShieldCheck size={22} />
      </span>
      <div className={styles.conviteTexto}>
        <h3 id="convite-reserva-titulo">{CONVITE_TITULO}</h3>
        <p>{CONVITE_TEXTO}</p>
      </div>
      <div className={styles.conviteAcoes}>
        <button type="button" className="btn btn-verde" onClick={onConfigurar}>
          Configurar minha reserva
        </button>
        <button type="button" className="btn btn-secundario" onClick={() => mudar(true)}>
          Agora não
        </button>
      </div>
    </section>
  );
}

export default ConviteReserva;
